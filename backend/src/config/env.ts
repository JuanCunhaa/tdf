import { z } from 'zod';

const schema = z.object({
  PORT: z.coerce.number().default(4000),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  DATABASE_URL: z.string().url(),
  JWT_SECRET: z.string().min(16),
  JWT_EXPIRES_IN: z.string().default('7d'),
  UPLOAD_DIR: z.string().default('./uploads'),
  MAX_UPLOAD_MB: z.coerce.number().default(10),
  DISCORD_BOT_TOKEN: z.string().optional(),
  DISCORD_CHANNEL_ID: z.string().optional(),
  DISCORD_RECRUITMENT_WEBHOOK: z.string().url().optional(),
  CORS_ORIGIN: z.string().optional(),
  // Optional bootstrap admin
  SEED_ADMIN_ENABLED: z.string().optional(),
  SEED_ADMIN_EMAIL: z.string().email().optional(),
  SEED_ADMIN_PASSWORD: z.string().optional(),
  SEED_ADMIN_NICKNAME: z.string().optional(),
  SEED_ADMIN_DISCORD: z.string().optional(),
  SEED_ADMIN_ROLE: z.enum(['LEADER','ELITE','ADMIN','MEMBER']).optional(),
});

export const env = schema.parse(process.env);
