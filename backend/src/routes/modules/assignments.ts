import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../../prisma';
import { requireAuth, requireRole } from '../../middleware/auth';
import { sanitizeText } from '../../utils/sanitize';
import { notify } from '../../services/notifications';

const router = Router();

// Admin create assignment and assign to users
router.post('/', requireAuth, requireRole('ADMIN', 'ELITE', 'LEADER'), async (req, res) => {
  const schema = z.object({
    title: z.string().min(3),
    description: z.string().min(3),
    assignees: z.array(z.string().uuid()).min(1),
  });
  const body = schema.parse(req.body);
  const userId = (req as any).user.sub as string;
  const assignment = await prisma.assignment.create({
    data: {
      title: sanitizeText(body.title, 120)!,
      description: sanitizeText(body.description, 2000)!,
      created_by: userId,
      submissions: { createMany: { data: body.assignees.map((uid) => ({ user_id: uid })) } },
    },
  });
  res.status(201).json({ assignment });
});

// Admin list assignments with counts
router.get('/', requireAuth, requireRole('ADMIN', 'ELITE', 'LEADER'), async (_req, res) => {
  const list = await prisma.assignment.findMany({ orderBy: { created_at: 'desc' } });
  const ids = list.map((a) => a.id);
  const counts = await prisma.assignmentSubmission.groupBy({ by: ['assignment_id', 'status'], where: { assignment_id: { in: ids } }, _count: { _all: true } });
  const byId: any = {};
  counts.forEach((c) => {
    byId[c.assignment_id] = byId[c.assignment_id] || { OPEN: 0, SUBMITTED: 0, APPROVED: 0, REJECTED: 0 };
    (byId[c.assignment_id] as any)[c.status] = c._count._all;
  });
  res.json({ assignments: list.map((a) => ({ ...a, counts: byId[a.id] || {} })) });
});

// Admin get submissions pending review
router.get('/submissions', requireAuth, requireRole('ADMIN', 'ELITE', 'LEADER'), async (req, res) => {
  const status = (req.query.status as string) || 'SUBMITTED';
  const list = await prisma.assignmentSubmission.findMany({
    where: { status: status as any },
    orderBy: { created_at: 'desc' },
    include: { assignment: true, user: { select: { id: true, nickname: true } } },
  });
  res.json({ submissions: list });
});

// User: my assignments (active only)
router.get('/my', requireAuth, async (req, res) => {
  const userId = (req as any).user.sub as string;
  const list = await prisma.assignmentSubmission.findMany({
    where: { user_id: userId, status: { in: ['OPEN', 'SUBMITTED'] } },
    orderBy: { created_at: 'desc' },
    include: { assignment: true },
  });
  res.json({ items: list });
});

// User submit
router.post('/:id/submit', requireAuth, async (req, res) => {
  const schema = z.object({ explanation: z.string().min(5), evidence_url: z.string().url() });
  const body = schema.parse(req.body);
  const userId = (req as any).user.sub as string;
  // :id is assignment_id, we update the submission row for this user
  const existing = await prisma.assignmentSubmission.findFirst({ where: { assignment_id: req.params.id, user_id: userId } });
  if (!existing) return res.status(404).json({ error: 'Assignment not found' });
  const updated = await prisma.assignmentSubmission.update({ where: { id: existing.id }, data: { status: 'SUBMITTED', explanation: sanitizeText(body.explanation, 2000)!, evidence_url: body.evidence_url, submitted_at: new Date() } });
  res.json({ submission: updated });
});

// Admin approve/reject
router.post('/submissions/:id/approve', requireAuth, requireRole('ADMIN', 'ELITE', 'LEADER'), async (req, res) => {
  const reviewerId = (req as any).user.sub as string;
  const sub = await prisma.assignmentSubmission.findUnique({ where: { id: req.params.id } });
  if (!sub) return res.status(404).json({ error: 'Not found' });
  if (sub.status !== 'SUBMITTED') return res.status(400).json({ error: 'Not in submitted state' });
  await prisma.assignmentSubmission.update({ where: { id: sub.id }, data: { status: 'APPROVED', reviewed_by: reviewerId, reviewed_at: new Date() } });
  await notify(sub.user_id, 'SYSTEM', 'Submissão concluída', 'Sua submissão foi aprovada.');
  res.json({ ok: true });
});

router.post('/submissions/:id/reject', requireAuth, requireRole('ADMIN', 'ELITE', 'LEADER'), async (req, res) => {
  const reviewerId = (req as any).user.sub as string;
  const reason = (req.body?.reason as string) || '';
  const sub = await prisma.assignmentSubmission.findUnique({ where: { id: req.params.id } });
  if (!sub) return res.status(404).json({ error: 'Not found' });
  if (sub.status !== 'SUBMITTED') return res.status(400).json({ error: 'Not in submitted state' });
  await prisma.assignmentSubmission.update({ where: { id: sub.id }, data: { status: 'REJECTED', reviewed_by: reviewerId, reviewed_at: new Date() } });
  await notify(sub.user_id, 'SYSTEM', 'Submissão recusada', reason || 'Sua submissão foi recusada.');
  res.json({ ok: true });
});

// Admin delete a submission (any status)
router.delete('/submissions/:id', requireAuth, requireRole('ADMIN', 'ELITE', 'LEADER'), async (req, res) => {
  const sub = await prisma.assignmentSubmission.findUnique({ where: { id: req.params.id } });
  if (!sub) return res.status(404).json({ error: 'Not found' });
  await prisma.assignmentSubmission.delete({ where: { id: sub.id } });
  res.json({ ok: true });
});

// Admin delete an entire assignment (and its submissions)
router.delete('/:id', requireAuth, requireRole('ADMIN', 'ELITE', 'LEADER'), async (req, res) => {
  const id = req.params.id;
  const a = await prisma.assignment.findUnique({ where: { id } });
  if (!a) return res.status(404).json({ error: 'Not found' });
  await prisma.$transaction([
    prisma.assignmentSubmission.deleteMany({ where: { assignment_id: id } }),
    prisma.assignment.delete({ where: { id } }),
  ]);
  res.json({ ok: true });
});

export default router;
