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

router.post('/', requireAuth, upload.array('files', 5), async (req, res) => {
  const schema = z.object({ goal_id: z.string().uuid(), amount: z.coerce.number().int().optional(), note: z.string().optional() });
  const body = schema.parse(req.body);
  const userId = (req as any).user.sub as string;
  const sub = await prisma.goalSubmission.create({ data: { goal_id: body.goal_id, submitted_by: userId, amount: body.amount ?? null, note: sanitizeText(body.note || null, 1000) } });

  const files = (req.files as Express.Multer.File[]) || [];
  if (files.length) {
    await prisma.upload.createMany({
      data: files.map((f) => ({
        kind: 'GOAL_EVIDENCE',
        storage_path: path.resolve(f.path),
        mime_type: f.mimetype,
        size_bytes: f.size,
        goal_submission_id: sub.id,
      })),
    });
  }

  res.status(201).json({ submission: sub });
});

// Admin list submissions
router.get('/', requireAuth, requireRole('ADMIN', 'ELITE', 'LEADER'), async (req, res) => {
  const status = (req.query.status as string) || undefined;
  const goal_id = (req.query.goal_id as string) || undefined;
  const list = await prisma.goalSubmission.findMany({
    where: { status: status as any, goal_id: goal_id as any },
    orderBy: { created_at: 'desc' },
    include: { uploads: true, goal: true, submittedBy: { select: { id: true, nickname: true } } },
  });
  res.json({ submissions: list });
});

router.get('/mine', requireAuth, async (req, res) => {
  const userId = (req as any).user.sub as string;
  const list = await prisma.goalSubmission.findMany({ where: { submitted_by: userId }, orderBy: { created_at: 'desc' }, include: { uploads: true, goal: true } });
  res.json({ submissions: list });
});

router.post('/:id/approve', requireAuth, requireRole('ADMIN', 'ELITE', 'LEADER'), async (req, res) => {
  const reviewerId = (req as any).user.sub as string;
  const sub = await prisma.goalSubmission.findUnique({ where: { id: req.params.id } });
  if (!sub) return res.status(404).json({ error: 'Submission not found' });
  const evidenceCount = await prisma.upload.count({ where: { goal_submission_id: sub.id } });
  if (evidenceCount === 0) return res.status(400).json({ error: 'Evidence required to approve' });
  if (sub.status !== 'PENDING') return res.status(400).json({ error: 'Already reviewed' });

  await prisma.$transaction(async (tx) => {
    await tx.goalSubmission.update({ where: { id: sub.id }, data: { status: 'APPROVED', reviewed_by: reviewerId, reviewed_at: new Date() } });
    // naive stats increment
    const today = new Date();
    const snapshotDate = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate()));
    const existing = await tx.userStats.findUnique({ where: { user_id_snapshot_date: { user_id: sub.submitted_by, snapshot_date: snapshotDate } } });
    if (existing) {
      await tx.userStats.update({ where: { id: existing.id }, data: { goals_completed: existing.goals_completed + 1, rank_points: existing.rank_points + 10 } });
    } else {
      await tx.userStats.create({ data: { user_id: sub.submitted_by, snapshot_date: snapshotDate, goals_completed: 1, rank_points: 10, submissions_made: 0, playtime_hours: 0 } });
    }
  });

  await logAudit({ actorId: reviewerId, action: 'SUBMISSION_APPROVED', entity: 'GOAL_SUBMISSION', entityId: sub.id });
  await notify(sub.submitted_by, 'GOAL_STATUS', 'Meta aprovada', 'Sua comprovação de meta foi aprovada.');
  res.json({ ok: true });
});

router.post('/:id/reject', requireAuth, requireRole('ADMIN', 'ELITE', 'LEADER'), async (req, res) => {
  const reviewerId = (req as any).user.sub as string;
  const sub = await prisma.goalSubmission.findUnique({ where: { id: req.params.id } });
  if (!sub) return res.status(404).json({ error: 'Submission not found' });
  if (sub.status !== 'PENDING') return res.status(400).json({ error: 'Already reviewed' });
  await prisma.goalSubmission.update({ where: { id: sub.id }, data: { status: 'REJECTED', reviewed_by: reviewerId, reviewed_at: new Date() } });
  await logAudit({ actorId: reviewerId, action: 'SUBMISSION_REJECTED', entity: 'GOAL_SUBMISSION', entityId: sub.id });
  await notify(sub.submitted_by, 'GOAL_STATUS', 'Meta rejeitada', 'Sua comprovação de meta foi rejeitada.');
  res.json({ ok: true });
});

export default router;
