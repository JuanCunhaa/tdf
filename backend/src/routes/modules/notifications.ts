import { Router } from 'express';
import { prisma } from '../../prisma';
import { requireAuth } from '../../middleware/auth';

const router = Router();

router.get('/', requireAuth, async (req, res) => {
  const userId = (req as any).user.sub as string;
  const list = await prisma.notification.findMany({ where: { recipient_id: userId }, orderBy: { created_at: 'desc' } });
  res.json({ notifications: list });
});

router.post('/:id/read', requireAuth, async (req, res) => {
  const userId = (req as any).user.sub as string;
  const n = await prisma.notification.findUnique({ where: { id: req.params.id } });
  if (!n || n.recipient_id !== userId) return res.status(404).json({ error: 'Not found' });
  await prisma.notification.update({ where: { id: n.id }, data: { read: true } });
  res.json({ ok: true });
});

export default router;

