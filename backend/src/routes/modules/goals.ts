import { Router } from 'express';
import { prisma } from '../../prisma';
import { z } from 'zod';
import { requireAuth, requireRole } from '../../middleware/auth';
import { sanitizeText } from '../../utils/sanitize';
import { logAudit } from '../../services/audit';

const router = Router();

router.get('/', requireAuth, async (req, res) => {
  const status = (req.query.status as string) || 'ACTIVE';
  const visibility = (req.query.visibility as string) || undefined; // PUBLIC or CLAN
  const type = (req.query.type as string) || undefined; // FARM/BUILD/RANK/EVENT/OTHER
  const goals = await prisma.goal.findMany({
    where: { status: status as any, visibility: visibility as any, type: type as any },
    orderBy: { created_at: 'desc' },
  });
  const userId = (req as any).user.sub as string;
  const goalIds = goals.filter((g:any)=> g.target_amount != null).map((g:any)=> g.id);
  let clanSums: Record<string, number> = {};
  let mySums: Record<string, number> = {};
  // Daily status (USER is_daily): did I submit today? what status?
  const userDailyGoalIds = goals.filter((g:any)=> g.scope === 'USER' && g.is_daily).map((g:any)=> g.id);
  let dailyStatus: Record<string, 'PENDING'|'APPROVED'|'REJECTED'|null> = {};
  if (userDailyGoalIds.length) {
    const today = new Date();
    const dayStart = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate()));
    const subs = await prisma.goalSubmission.findMany({ where: { goal_id: { in: userDailyGoalIds }, submitted_by: userId, created_at: { gte: dayStart } }, orderBy: { created_at: 'desc' } });
    subs.forEach((s:any)=>{ if(!(s.goal_id in dailyStatus)) dailyStatus[s.goal_id] = s.status; });
  }
  if (goalIds.length) {
    const aggClan = await prisma.goalSubmission.groupBy({ by: ['goal_id'], where: { goal_id: { in: goalIds }, status: 'APPROVED' }, _sum: { amount: true } });
    aggClan.forEach((a:any) => { clanSums[a.goal_id] = (a._sum.amount || 0); });
    const aggMine = await prisma.goalSubmission.groupBy({ by: ['goal_id'], where: { goal_id: { in: goalIds }, status: 'APPROVED', submitted_by: userId }, _sum: { amount: true } });
    aggMine.forEach((a:any) => { mySums[a.goal_id] = (a._sum.amount || 0); });
  }
  const withProgress = goals.map((g:any) => {
    const clan = g.target_amount != null ? (clanSums[g.id] || 0) : null;
    const mine = g.target_amount != null ? (mySums[g.id] || 0) : null;
    const clanComplete = g.target_amount != null ? (clan! >= g.target_amount) : false;
    const mineComplete = g.target_amount != null ? (mine! >= g.target_amount) : false;
    const todayStatus = (g.scope === 'USER' && g.is_daily) ? (dailyStatus[g.id] || null) : null;
    return { ...g, progress: { clan, mine, clanComplete, mineComplete }, todayStatus };
  });
  res.json({ goals: withProgress });
});

router.post('/', requireAuth, requireRole('ADMIN', 'ELITE', 'LEADER'), async (req, res) => {
  const schema = z.object({
    title: z.string().min(3),
    description: z.string().min(3),
    type: z.enum(['FARM', 'BUILD', 'RANK', 'EVENT', 'OTHER']).default('OTHER'),
    target_amount: z.number().int().optional(),
    unit: z.string().optional(),
    starts_at: z.string().datetime().optional(),
    ends_at: z.string().datetime().optional(),
    visibility: z.enum(['PUBLIC', 'CLAN']).default('CLAN'),
    scope: z.enum(['USER','CLAN']).default('USER'),
  });
  const body = schema.parse(req.body);
  const userId = (req as any).user.sub as string;
  const created = await prisma.goal.create({
    data: {
      ...body,
      title: sanitizeText(body.title, 120)!,
      description: sanitizeText(body.description, 1000)!,
      starts_at: body.starts_at ? new Date(body.starts_at) : null,
      ends_at: body.ends_at ? new Date(body.ends_at) : null,
      is_daily: body.scope === 'USER',
      created_by: userId,
    },
  });
  res.status(201).json({ goal: created });
  await logAudit({ actorId: userId, action: 'GOAL_CREATED', entity: 'GOAL', entityId: created.id, metadata: { title: created.title, scope: created.scope, target_amount: created.target_amount } });
});

router.patch('/:id', requireAuth, requireRole('ADMIN', 'ELITE', 'LEADER'), async (req, res) => {
  const schema = z.object({
    title: z.string().min(3).optional(),
    description: z.string().min(3).optional(),
    type: z.enum(['FARM', 'BUILD', 'RANK', 'EVENT', 'OTHER']).optional(),
    target_amount: z.number().int().nullable().optional(),
    unit: z.string().nullable().optional(),
    starts_at: z.string().datetime().nullable().optional(),
    ends_at: z.string().datetime().nullable().optional(),
    visibility: z.enum(['PUBLIC', 'CLAN']).optional(),
    scope: z.enum(['USER','CLAN']).optional(),
    status: z.enum(['ACTIVE', 'PAUSED', 'ARCHIVED']).optional(),
  });
  const body = schema.parse(req.body);
  const updated = await prisma.goal.update({
    where: { id: req.params.id },
    data: {
      ...body,
      title: body.title === undefined ? undefined : sanitizeText(body.title, 120)!,
      description: body.description === undefined ? undefined : sanitizeText(body.description, 1000)!,
      starts_at: body.starts_at === undefined ? undefined : body.starts_at ? new Date(body.starts_at) : null,
      ends_at: body.ends_at === undefined ? undefined : body.ends_at ? new Date(body.ends_at) : null,
    },
  });
  res.json({ goal: updated });
  await logAudit({ actorId: (req as any).user.sub, action: 'GOAL_UPDATED', entity: 'GOAL', entityId: updated.id, metadata: req.body });
});

router.delete('/:id', requireAuth, requireRole('LEADER'), async (req, res) => {
  await prisma.goal.delete({ where: { id: req.params.id } });
  await logAudit({ actorId: (req as any).user.sub, action: 'GOAL_DELETED', entity: 'GOAL', entityId: req.params.id });
  res.json({ ok: true });
});

// Admin: goal detail and progress view
router.get('/:id/detail', requireAuth, requireRole('ADMIN','ELITE','LEADER'), async (req, res) => {
  const id = req.params.id;
  const goal = await prisma.goal.findUnique({ where: { id } });
  if (!goal) return res.status(404).json({ error: 'Goal not found' });

  if (goal.scope === 'CLAN') {
    const contributions = await prisma.goalSubmission.findMany({
      where: { goal_id: id },
      orderBy: { created_at: 'desc' },
      include: { submittedBy: { select: { id: true, nickname: true } }, uploads: true },
    });
    const approved = contributions.filter((c:any)=> c.status === 'APPROVED');
    const totalApproved = approved.reduce((acc:number, c:any)=> acc + (c.amount || 0), 0);
    // ranking by approved contributions count
    const counts: Record<string, { user_id:string; nickname:string; count:number; amount:number }> = {};
    approved.forEach((c:any)=>{
      const key = c.submitted_by;
      counts[key] = counts[key] || { user_id: key, nickname: c.submittedBy?.nickname || key, count: 0, amount: 0 };
      counts[key].count += 1;
      counts[key].amount += (c.amount || 0);
    });
    const ranking = Object.values(counts).sort((a,b)=> b.count - a.count).slice(0, 100);
    return res.json({ goal, totalApproved, contributions, ranking });
  }

  // USER daily: list all active users with today's status + today's submissions
  const users = await prisma.user.findMany({ where: { status: 'ACTIVE' }, select: { id: true, nickname: true } });
  const today = new Date();
  const dayStart = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate()));
  const subs = await prisma.goalSubmission.findMany({ where: { goal_id: id, created_at: { gte: dayStart } }, orderBy: { created_at: 'desc' }, include: { submittedBy: { select: { id: true, nickname: true } }, uploads: true } });
  const byUser: Record<string, string> = {};
  subs.forEach((s:any)=>{ if(!(s.submitted_by in byUser)) byUser[s.submitted_by] = s.status; });
  const items = users.map(u => ({ user_id: u.id, nickname: u.nickname, todayStatus: (byUser[u.id] as any) || null }));
  return res.json({ goal, users: items, submissions: subs });
});

export default router;
