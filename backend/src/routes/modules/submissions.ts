import { Router } from 'express';
import { prisma } from '../../prisma';
import { requireAuth, requireRole } from '../../middleware/auth';
import multer from 'multer';
import path from 'node:path';
import fs from 'node:fs';
import { env } from '../../config/env';
import { z } from 'zod';
import { logAudit } from '../../services/audit';
import { notify } from '../../services/notifications';
import mime from 'mime-types';
import { sanitizeText } from '../../utils/sanitize';

const router = Router();

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, env.UPLOAD_DIR),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname) || '.' + (mime.extension(file.mimetype) || 'bin');
    const name = `evi_${Date.now()}_${Math.random().toString(36).slice(2)}${ext}`;
    cb(null, name);
  },
});

function fileFilter(_req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) {
  const allowed = ['image/png', 'image/jpeg', 'image/webp'];
  if (!allowed.includes(file.mimetype)) return cb(new Error('Only image uploads allowed'));
  cb(null, true);
}

const upload = multer({ storage, limits: { fileSize: env.MAX_UPLOAD_MB * 1024 * 1024 }, fileFilter });

// Create submission by user (supports evidence_url or image uploads)
router.post('/', requireAuth, upload.array('files', 5), async (req, res) => {
  const schema = z.object({ goal_id: z.string().uuid(), amount: z.coerce.number().int().optional(), note: z.string().optional(), evidence_url: z.string().url().optional() });
  const body = schema.parse(req.body);
  const userId = (req as any).user.sub as string;
  const sub = await prisma.goalSubmission.create({ data: { goal_id: body.goal_id, submitted_by: userId, amount: body.amount ?? null, note: sanitizeText(body.note || null, 1000), evidence_url: body.evidence_url || null } });

  const files = (req.files as Express.Multer.File[]) || [];
  if (files.length) {
    await prisma.upload.createMany({
      data: files.map((f) => ({ kind: 'GOAL_EVIDENCE', storage_path: path.resolve(f.path), mime_type: f.mimetype, size_bytes: f.size, goal_submission_id: sub.id })),
    });
  }

  res.status(201).json({ submission: sub });
});

// Admin list submissions
router.get('/', requireAuth, requireRole('ADMIN', 'ELITE', 'LEADER'), async (req, res) => {
  const status = (req.query.status as string) || undefined;
  const goal_id = (req.query.goal_id as string) || undefined;
  const list = await prisma.goalSubmission.findMany({ where: { status: status as any, goal_id: goal_id as any }, orderBy: { created_at: 'desc' }, include: { uploads: true, goal: true, submittedBy: { select: { id: true, nickname: true } } } });
  res.json({ submissions: list });
});

// My submissions (user)
router.get('/mine', requireAuth, async (req, res) => {
  const userId = (req as any).user.sub as string;
  const list = await prisma.goalSubmission.findMany({ where: { submitted_by: userId }, orderBy: { created_at: 'desc' }, include: { uploads: true, goal: true } });
  res.json({ submissions: list });
});

// Approve submission
router.post('/:id/approve', requireAuth, requireRole('ADMIN', 'ELITE', 'LEADER'), async (req, res) => {
  const reviewerId = (req as any).user.sub as string;
  const sub = await prisma.goalSubmission.findUnique({ where: { id: req.params.id } });
  if (!sub) return res.status(404).json({ error: 'Submission not found' });
  const evidenceCount = await prisma.upload.count({ where: { goal_submission_id: sub.id } });
  if (evidenceCount === 0 && !sub.evidence_url) return res.status(400).json({ error: 'Evidence required to approve' });
  if (sub.status !== 'PENDING') return res.status(400).json({ error: 'Already reviewed' });
  const goal = await prisma.goal.findUnique({ where: { id: sub.goal_id } });
  if (!goal) return res.status(404).json({ error: 'Goal not found' });

  await prisma.$transaction(async (tx) => {
    if (goal.scope === 'USER' && (goal as any).is_daily) {
      const today = new Date();
      const dayStart = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate()));
      const already = await tx.goalSubmission.findFirst({ where: { goal_id: sub.goal_id, submitted_by: sub.submitted_by, status: 'APPROVED', created_at: { gte: dayStart } } });
      if (already) {
        throw Object.assign(new Error('Already completed today'), { status: 400 });
      }
    }
    await tx.goalSubmission.update({ where: { id: sub.id }, data: { status: 'APPROVED', reviewed_by: reviewerId, reviewed_at: new Date() } });
    const today = new Date();
    const snapshotDate = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate()));
    const existing = await tx.userStats.findUnique({ where: { user_id_snapshot_date: { user_id: sub.submitted_by, snapshot_date: snapshotDate } } });
    if (existing) {
      await tx.userStats.update({ where: { id: existing.id }, data: {
        goals_completed: existing.goals_completed + 1,
        rank_points: existing.rank_points + 10,
        daily_goals_points: (goal.scope === 'USER' && (goal as any).is_daily) ? (existing as any).daily_goals_points + 1 : (existing as any).daily_goals_points,
        clan_contrib_approved_count: (goal.scope === 'CLAN') ? (existing as any).clan_contrib_approved_count + 1 : (existing as any).clan_contrib_approved_count,
      } as any });
    } else {
      await tx.userStats.create({ data: { user_id: sub.submitted_by, snapshot_date: snapshotDate, goals_completed: 1, rank_points: 10, submissions_made: 0, playtime_hours: 0, daily_goals_points: (goal.scope === 'USER' && (goal as any).is_daily) ? 1 : 0, clan_contrib_approved_count: (goal.scope === 'CLAN') ? 1 : 0 } });
    }
  });

  await logAudit({ actorId: reviewerId, action: 'SUBMISSION_APPROVED', entity: 'GOAL_SUBMISSION', entityId: sub.id });
  const unit = (goal as any)?.unit ? ` ${(goal as any).unit}` : '';
  const approvedMsg = (sub.amount != null) ? `Sua contribuição de ${sub.amount}${unit} foi aprovada.` : 'Sua comprovação de meta foi aprovada.';
  await notify(sub.submitted_by, 'GOAL_STATUS', 'Meta aprovada', approvedMsg);
  res.json({ ok: true });
});

// Reject submission (with optional reason)
router.post('/:id/reject', requireAuth, requireRole('ADMIN', 'ELITE', 'LEADER'), async (req, res) => {
  const reviewerId = (req as any).user.sub as string;
  const schema = z.object({ reason: z.string().max(500).optional() });
  const { reason } = schema.parse(req.body || {});
  const sub = await prisma.goalSubmission.findUnique({ where: { id: req.params.id } });
  if (!sub) return res.status(404).json({ error: 'Submission not found' });
  if (sub.status !== 'PENDING') return res.status(400).json({ error: 'Already reviewed' });
  await prisma.goalSubmission.update({ where: { id: sub.id }, data: { status: 'REJECTED', reviewed_by: reviewerId, reviewed_at: new Date(), rejection_reason: reason || null } });
  await logAudit({ actorId: reviewerId, action: 'SUBMISSION_REJECTED', entity: 'GOAL_SUBMISSION', entityId: sub.id, metadata: { reason } });
  const msg = reason && reason.trim() ? `Sua contribuição foi recusada. Motivo: ${reason.trim()}` : 'Sua contribuição foi recusada.';
  await notify(sub.submitted_by, 'GOAL_STATUS', 'Meta rejeitada', msg);
  res.json({ ok: true });
});

// Admin create submission on behalf of user
router.post('/admin-create', requireAuth, requireRole('ADMIN', 'ELITE', 'LEADER'), upload.array('files', 5), async (req, res) => {
  const schema = z.object({ user_id: z.string().uuid(), goal_id: z.string().uuid(), amount: z.coerce.number().int().optional(), note: z.string().optional(), status: z.enum(['PENDING','APPROVED','REJECTED']).default('PENDING') });
  const body = schema.parse(req.body);
  const sub = await prisma.goalSubmission.create({ data: { goal_id: body.goal_id, submitted_by: body.user_id, amount: body.amount ?? null, note: sanitizeText(body.note || null, 1000), status: body.status } });
  const files = (req.files as Express.Multer.File[]) || [];
  if (files.length) {
    await prisma.upload.createMany({ data: files.map((f) => ({ kind: 'GOAL_EVIDENCE', storage_path: path.resolve(f.path), mime_type: f.mimetype, size_bytes: f.size, goal_submission_id: sub.id })) });
  }
  if (body.status === 'APPROVED') {
    const today = new Date();
    const snapshotDate = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate()));
    const goal = await prisma.goal.findUnique({ where: { id: body.goal_id } });
    const existing = await prisma.userStats.findUnique({ where: { user_id_snapshot_date: { user_id: body.user_id, snapshot_date: snapshotDate } } });
    if (existing) {
      await prisma.userStats.update({ where: { id: existing.id }, data: {
        goals_completed: existing.goals_completed + 1,
        rank_points: existing.rank_points + 10,
        daily_goals_points: (goal && goal.scope === 'USER' && (goal as any).is_daily) ? (existing as any).daily_goals_points + 1 : (existing as any).daily_goals_points,
        clan_contrib_approved_count: (goal && goal.scope === 'CLAN') ? (existing as any).clan_contrib_approved_count + 1 : (existing as any).clan_contrib_approved_count,
      } as any });
    } else {
      await prisma.userStats.create({ data: { user_id: body.user_id, snapshot_date: snapshotDate, goals_completed: 1, rank_points: 10, submissions_made: 0, playtime_hours: 0, daily_goals_points: (goal && goal.scope === 'USER' && (goal as any).is_daily) ? 1 : 0, clan_contrib_approved_count: (goal && goal.scope === 'CLAN') ? 1 : 0 } });
    }
  }
  res.status(201).json({ submission: sub });
});

// Delete a submission (any status) and rollback stats if approved
router.delete('/:id', requireAuth, requireRole('ADMIN', 'ELITE', 'LEADER'), async (req, res) => {
  const sub = await prisma.goalSubmission.findUnique({ where: { id: req.params.id } });
  if (!sub) return res.status(404).json({ error: 'Submission not found' });

  const goal = await prisma.goal.findUnique({ where: { id: sub.goal_id } });
  const ups = await prisma.upload.findMany({ where: { goal_submission_id: sub.id } });
  for (const u of ups) { try { if (u.storage_path && fs.existsSync(u.storage_path)) fs.unlinkSync(u.storage_path); } catch {} }

  await prisma.$transaction(async (tx) => {
    if (sub.status === 'APPROVED') {
      const dt = new Date(sub.created_at as any);
      const snapshotDate = new Date(Date.UTC(dt.getUTCFullYear(), dt.getUTCMonth(), dt.getUTCDate()));
      const stats = await tx.userStats.findUnique({ where: { user_id_snapshot_date: { user_id: sub.submitted_by, snapshot_date: snapshotDate } } });
      if (stats) {
        await tx.userStats.update({ where: { id: stats.id }, data: {
          goals_completed: Math.max(0, stats.goals_completed - 1),
          rank_points: Math.max(0, stats.rank_points - 10),
          daily_goals_points: (goal && goal.scope === 'USER' && (goal as any).is_daily) ? Math.max(0, (stats as any).daily_goals_points - 1) : (stats as any).daily_goals_points,
          clan_contrib_approved_count: (goal && goal.scope === 'CLAN') ? Math.max(0, (stats as any).clan_contrib_approved_count - 1) : (stats as any).clan_contrib_approved_count,
        } as any });
      }
    }
    await tx.upload.deleteMany({ where: { goal_submission_id: sub.id } });
    await tx.goalSubmission.delete({ where: { id: sub.id } });
  });

  await notify(sub.submitted_by, 'GOAL_STATUS', 'Contribuição removida', 'Sua contribuição foi removida pela administração. Você pode enviar novamente.');
  res.json({ ok: true });
});

export default router;

