import { prisma } from './prisma';
import { env } from './config/env';
import { hashPassword } from './utils/password';

export async function ensureSeedAdmin() {
  if (!env.SEED_ADMIN_ENABLED || env.SEED_ADMIN_ENABLED.toLowerCase() !== 'true') return;
  const email = env.SEED_ADMIN_EMAIL || 'admin@tdf.gg';
  const nickname = env.SEED_ADMIN_NICKNAME || 'Mod01';
  const discord = env.SEED_ADMIN_DISCORD || 'Mod01#0003';
  const role = env.SEED_ADMIN_ROLE || 'ADMIN';
  const password = env.SEED_ADMIN_PASSWORD || 'Admin#1234';

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    console.log('[bootstrap] Admin já existe:', email);
    return;
  }
  const hash = await hashPassword(password);
  await prisma.user.create({
    data: {
      email,
      nickname,
      discord_tag: discord,
      password_hash: hash,
      must_change_password: false,
      role: role as any,
      status: 'ACTIVE',
      joined_at: new Date(),
    },
  });
  console.log('[bootstrap] Admin criado:', email);
}

