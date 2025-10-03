import 'dotenv/config';
import 'express-async-errors';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import path from 'node:path';
import fs from 'node:fs';
import { env } from './config/env';
import { errorHandler } from './middleware/error';
import router from './routes';
import { ensureSeedAdmin } from './bootstrap';
import { blockSqlMeta } from './middleware/security';

const app = express();

const origins = env.CORS_ORIGIN ? env.CORS_ORIGIN.split(',').map((s) => s.trim()) : undefined;
app.use(cors({ origin: origins || true }));
app.use(helmet());
app.use(express.json({ limit: '2mb' }));
app.use(morgan('dev'));
app.use(blockSqlMeta);

// Ensure upload dir exists
if (!fs.existsSync(env.UPLOAD_DIR)) {
  fs.mkdirSync(env.UPLOAD_DIR, { recursive: true });
}

// Static files for uploaded content
app.use('/uploads', express.static(path.resolve(env.UPLOAD_DIR)));
app.use('/static', express.static(path.resolve('static')));

app.get('/health', (_req, res) => {
  res.json({ ok: true, service: 'tdf-backend', env: env.NODE_ENV });
});

app.use('/api', router);

app.use(errorHandler);

// Bootstrap admin if enabled
ensureSeedAdmin().catch((e) => console.error('[bootstrap] error:', e));

app.listen(env.PORT, () => {
  console.log(`TDF API running on http://localhost:${env.PORT}`);
});
