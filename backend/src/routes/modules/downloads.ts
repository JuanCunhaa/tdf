import { Router } from 'express';
import fs from 'node:fs';
import path from 'node:path';

const router = Router();
const downloadsDir = path.resolve('static', 'downloads');

router.get('/', async (_req, res) => {
  if (!fs.existsSync(downloadsDir)) {
    return res.json({ files: [] });
  }
  const files = fs.readdirSync(downloadsDir).filter((f) => fs.statSync(path.join(downloadsDir, f)).isFile());
  res.json({ files: files.map((f) => ({ name: f, url: `/static/downloads/${encodeURIComponent(f)}` })) });
});

export default router;

