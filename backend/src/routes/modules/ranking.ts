import { Router } from 'express';
import { prisma } from '../../prisma';

const router = Router();

router.get('/', async (_req, res) => {
  // Aggregate totals per user
  const stats = await prisma.userStats.groupBy({ by: ['user_id'], _sum: { rank_points: true, goals_completed: true, daily_goals_points: true, clan_contrib_approved_count: true } });
  const users = await prisma.user.findMany({});
  const mapNick = new Map(users.map((u) => [u.id, u.nickname]));
  const topByRank = [...stats]
    .map((s) => ({ user_id: s.user_id, nickname: mapNick.get(s.user_id) || s.user_id, rank_points: s._sum.rank_points || 0 }))
    .sort((a, b) => b.rank_points - a.rank_points)
    .slice(0, 20);
  const topByGoals = [...stats]
    .map((s) => ({ user_id: s.user_id, nickname: mapNick.get(s.user_id) || s.user_id, goals_completed: s._sum.goals_completed || 0 }))
    .sort((a, b) => b.goals_completed - a.goals_completed)
    .slice(0, 20);
  const topByDaily = [...stats]
    .map((s) => ({ user_id: s.user_id, nickname: mapNick.get(s.user_id) || s.user_id, daily_points: s._sum.daily_goals_points || 0 }))
    .sort((a, b) => b.daily_points - a.daily_points)
    .slice(0, 20);
  const topByClanContribs = [...stats]
    .map((s) => ({ user_id: s.user_id, nickname: mapNick.get(s.user_id) || s.user_id, contribs: s._sum.clan_contrib_approved_count || 0 }))
    .sort((a, b) => b.contribs - a.contribs)
    .slice(0, 20);
  res.json({ topByRankPoints: topByRank, topByGoalsCompleted: topByGoals, topByDailyGoals: topByDaily, topByClanContribs });
});

export default router;
