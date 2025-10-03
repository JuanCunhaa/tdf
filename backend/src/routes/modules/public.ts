import { Router } from 'express';
import { prisma } from '../../prisma';
import path from 'node:path';

const router = Router();

router.get('/staff', async (_req, res) => {
  const staff = await prisma.user.findMany({
    where: { role: { in: ['LEADER', 'ELITE'] }, status: 'ACTIVE' },
    select: { id: true, nickname: true, discord_tag: true, role: true, joined_at: true },
    orderBy: [{ role: 'asc' }, { joined_at: 'asc' }],
  });
  res.json({ staff });
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
