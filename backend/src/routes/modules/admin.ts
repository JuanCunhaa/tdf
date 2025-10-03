import { Router } from 'express';
import { prisma } from '../../prisma';
import { requireAuth, requireRole } from '../../middleware/auth';

const router = Router();

router.get('/summary', requireAuth, requireRole('ADMIN', 'ELITE', 'LEADER'), async (_req, res) => {
  const [members, pendingForms, activeGoals, pendingSubs] = await Promise.all([
    prisma.user.count({ where: { status: 'ACTIVE' } }),
    prisma.recruitmentApplication.count({ where: { status: 'PENDING' } }),
    prisma.goal.count({ where: { status: 'ACTIVE' } }),
    prisma.goalSubmission.count({ where: { status: 'PENDING' } }),
  ]);
  res.json({ members, pendingForms, activeGoals, pendingSubs });
});

export default router;

