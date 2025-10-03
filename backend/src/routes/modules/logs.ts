import { Router } from 'express';
import { prisma } from '../../prisma';
import { requireAuth, requireRole } from '../../middleware/auth';

const router = Router();

router.get('/', requireAuth, requireRole('ADMIN', 'LEADER', 'ELITE'), async (req, res) => {
  const take = Math.min(Number(req.query.take || 50), 200);
  const cursor = (req.query.cursor as string) || undefined;
  const where = {};
  const logs = await prisma.auditLog.findMany({
    where,
    orderBy: { created_at: 'desc' },
    take,
    skip: cursor ? 1 : 0,
    cursor: cursor ? { id: cursor } : undefined,
    include: { actor: { select: { id: true, nickname: true, role: true } } as any },
  } as any);
  res.json({ logs, nextCursor: logs.length ? logs[logs.length - 1].id : null });
});

export default router;

