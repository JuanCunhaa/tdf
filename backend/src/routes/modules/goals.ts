import { Router } from 'express';
import { prisma } from '../../prisma';
import { z } from 'zod';
import { requireAuth, requireRole } from '../../middleware/auth';

const router = Router();

router.get('/', requireAuth, async (req, res) => {
  const status = (req.query.status as string) || 'ACTIVE';
  const visibility = (req.query.visibility as string) || undefined; // PUBLIC or CLAN
  const type = (req.query.type as string) || undefined; // FARM/BUILD/RANK/EVENT/OTHER
  const goals = await prisma.goal.findMany({
    where: { status: status as any, visibility: visibility as any, type: type as any },
    orderBy: { created_at: 'desc' },
  });
  res.json({ goals });
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
  });
  const body = schema.parse(req.body);
  const userId = (req as any).user.sub as string;
  const created = await prisma.goal.create({
    data: {
      ...body,
      starts_at: body.starts_at ? new Date(body.starts_at) : null,
      ends_at: body.ends_at ? new Date(body.ends_at) : null,
      created_by: userId,
    },
  });
  res.status(201).json({ goal: created });
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
    status: z.enum(['ACTIVE', 'PAUSED', 'ARCHIVED']).optional(),
  });
  const body = schema.parse(req.body);
  const updated = await prisma.goal.update({
    where: { id: req.params.id },
    data: {
      ...body,
      starts_at: body.starts_at === undefined ? undefined : body.starts_at ? new Date(body.starts_at) : null,
      ends_at: body.ends_at === undefined ? undefined : body.ends_at ? new Date(body.ends_at) : null,
    },
  });
  res.json({ goal: updated });
});

router.delete('/:id', requireAuth, requireRole('LEADER'), async (req, res) => {
  await prisma.goal.delete({ where: { id: req.params.id } });
  res.json({ ok: true });
});

export default router;
