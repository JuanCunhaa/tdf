import { Router } from 'express';
import multer from 'multer';
import path from 'node:path';
import { env } from '../../config/env';
import mime from 'mime-types';
import { requireAuth } from '../../middleware/auth';
import { prisma } from '../../prisma';

const router = Router();

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, env.UPLOAD_DIR),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname) || '.' + (mime.extension(file.mimetype) || 'bin');
    const name = `upl_${Date.now()}_${Math.random().toString(36).slice(2)}${ext}`;
    cb(null, name);
  },
});
const upload = multer({ storage, limits: { fileSize: env.MAX_UPLOAD_MB * 1024 * 1024 } });

router.post('/avatar', requireAuth, upload.single('file'), async (req, res) => {
  const userId = (req as any).user.sub as string;
  const f = req.file!;
  const up = await prisma.upload.create({ data: { kind: 'USER_AVATAR', storage_path: f.path, mime_type: f.mimetype, size_bytes: f.size, user_id: userId } });
  res.status(201).json({ upload: up, url: `/uploads/${path.basename(f.path)}` });
});

router.post('/application/:id', upload.single('file'), async (req, res) => {
  const f = req.file!;
  const up = await prisma.upload.create({ data: { kind: 'APPLICATION_ATTACHMENT', storage_path: f.path, mime_type: f.mimetype, size_bytes: f.size, application_id: req.params.id } });
  res.status(201).json({ upload: up, url: `/uploads/${path.basename(f.path)}` });
});

export default router;

