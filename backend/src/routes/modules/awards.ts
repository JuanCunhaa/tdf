import { Router } from 'express';
import { prisma } from '../../prisma';
import { z } from 'zod';
import { requireAuth, requireRole } from '../../middleware/auth';
import multer from 'multer';
import path from 'node:path';
import { env } from '../../config/env';
import mime from 'mime-types';

const router = Router();

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, env.UPLOAD_DIR),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname) || '.' + (mime.extension(file.mimetype) || 'bin');
    const name = `awd_${Date.now()}_${Math.random().toString(36).slice(2)}${ext}`;
    cb(null, name);
  },
});
const upload = multer({ storage, limits: { fileSize: env.MAX_UPLOAD_MB * 1024 * 1024 } });

router.get('/', async (_req, res) => {
  const list = await prisma.award.findMany({ orderBy: { achieved_on: 'desc' }, include: { uploads: true } });
  res.json({ awards: list });
});

router.post('/', requireAuth, requireRole('ADMIN', 'LEADER'), upload.array('media', 5), async (req, res) => {
  const schema = z.object({
    title: z.string().min(3),
    description: z.string().min(3),
    tier: z.enum(['GOLD', 'SILVER', 'BRONZE', 'SPECIAL']).default('SPECIAL'),
    achieved_on: z.string(),
    category: z.enum(['EVENT', 'BUILD', 'PVP', 'ECONOMY', 'MILESTONE', 'OTHER']).default('OTHER'),
    external_link: z.string().optional(),
  });
  const body = schema.parse(req.body);
  const created = await prisma.award.create({ data: { ...body, achieved_on: new Date(body.achieved_on) as any } as any });
  const files = (req.files as Express.Multer.File[]) || [];
  if (files.length) {
    await prisma.upload.createMany({
      data: files.map((f) => ({ kind: 'AWARD_MEDIA', storage_path: f.path, mime_type: f.mimetype, size_bytes: f.size, award_id: created.id })),
    });
  }
  res.status(201).json({ award: created });
});

export default router;

