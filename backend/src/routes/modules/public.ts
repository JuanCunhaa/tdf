import { Router } from 'express';
import { prisma } from '../../prisma';
import path from 'node:path';

const router = Router();

router.get('/staff', async (_req, res) => {
  const staff = await prisma.user.findMany({
    where: { role: { in: ['LEADER', 'ELITE'] }, status: 'ACTIVE' },
    include: { uploads: { where: { kind: 'USER_AVATAR' }, orderBy: { created_at: 'desc' }, take: 1 } },
    orderBy: [{ role: 'asc' }, { joined_at: 'asc' }],
  });
  const data = staff.map((u) => ({
    id: u.id,
    nickname: u.nickname,
    role: u.role,
    discord_tag: u.discord_tag,
    avatar_url: u.uploads[0]?.storage_path ? `/uploads/${require('node:path').basename(u.uploads[0].storage_path)}` : null,
  }));
  res.json({ staff: data });
});

router.get('/gallery', async (_req, res) => {
  const uploads = await prisma.upload.findMany({
    where: { kind: { in: ['AWARD_MEDIA'] } },
    orderBy: { created_at: 'desc' },
    take: 12,
  });
  const items = uploads.map(u => ({ id: u.id, url: `/uploads/${path.basename(u.storage_path)}`, created_at: u.created_at }));
  res.json({ items });
});

router.get('/events', async (_req, res) => {
  const events = await prisma.goal.findMany({ where: { type: 'EVENT', status: 'ACTIVE', visibility: 'PUBLIC' }, orderBy: { starts_at: 'asc' } });
  res.json({ events });
});

export default router;
