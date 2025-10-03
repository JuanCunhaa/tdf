import { Router } from 'express';
import { prisma } from '../../prisma';
import { z } from 'zod';
import jwt from 'jsonwebtoken';
import { env } from '../../config/env';
import { comparePassword, hashPassword } from '../../utils/password';
import { requireAuth } from '../../middleware/auth';
import crypto from 'node:crypto';

const router = Router();

function signToken(user: { id: string; role: string; nickname: string; must_change_password: boolean }) {
  return jwt.sign(
    { sub: user.id, role: user.role, nickname: user.nickname, mustChangePassword: user.must_change_password },
    env.JWT_SECRET,
    { expiresIn: env.JWT_EXPIRES_IN as any }
  );
}

router.post('/login-user', async (req, res) => {
  const schema = z.object({ nickname: z.string().min(3), password: z.string().min(6) });
  const { nickname, password } = schema.parse(req.body);
  const user = await prisma.user.findUnique({ where: { nickname } });
  if (!user) return res.status(401).json({ error: 'Invalid credentials' });
  const ok = await comparePassword(password, user.password_hash);
  if (!ok) return res.status(401).json({ error: 'Invalid credentials' });
  if (user.status !== 'ACTIVE') return res.status(403).json({ error: 'Account not active' });
  const token = signToken(user);
  res.json({ token, mustChangePassword: user.must_change_password, role: user.role, nickname: user.nickname });
});

router.post('/login-admin', async (req, res) => {
  const schema = z.object({ email: z.string().email(), password: z.string().min(6) });
  const { email, password } = schema.parse(req.body);
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) return res.status(401).json({ error: 'Invalid credentials' });
  if (!['ADMIN', 'ELITE', 'LEADER'].includes(user.role)) return res.status(403).json({ error: 'Not an admin' });
  const ok = await comparePassword(password, user.password_hash);
  if (!ok) return res.status(401).json({ error: 'Invalid credentials' });
  if (user.status !== 'ACTIVE') return res.status(403).json({ error: 'Account not active' });
  const token = signToken(user);
  res.json({ token, mustChangePassword: user.must_change_password, role: user.role, nickname: user.nickname, email: user.email });
});

router.get('/me', requireAuth, async (req, res) => {
  const userId = (req as any).user.sub as string;
  const me = await prisma.user.findUnique({ where: { id: userId }, select: { id: true, nickname: true, discord_tag: true, email: true, role: true, status: true, must_change_password: true, created_at: true, joined_at: true } });
  res.json({ user: me });
});

router.post('/change-password', requireAuth, async (req, res) => {
  const schema = z.object({ currentPassword: z.string().min(6), newPassword: z.string().min(8) });
  const { currentPassword, newPassword } = schema.parse(req.body);
  const userId = (req as any).user.sub as string;
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) return res.status(404).json({ error: 'User not found' });
  const ok = await comparePassword(currentPassword, user.password_hash);
  if (!ok) return res.status(400).json({ error: 'Current password is incorrect' });
  const password_hash = await hashPassword(newPassword);
  await prisma.user.update({ where: { id: user.id }, data: { password_hash, must_change_password: false } });
  res.json({ ok: true });
});

router.post('/request-reset', async (req, res) => {
  const schema = z.object({ identifier: z.string() });
  const { identifier } = schema.parse(req.body);
  const user = await prisma.user.findFirst({ where: { OR: [{ email: identifier }, { nickname: identifier }] } });
  if (!user) return res.json({ ok: true });
  const token = crypto.randomBytes(24).toString('hex');
  const token_hash = crypto.createHash('sha256').update(token).digest('hex');
  const expires_at = new Date(Date.now() + 1000 * 60 * 30); // 30 min
  await prisma.passwordReset.create({ data: { user_id: user.id, token_hash, expires_at } });
  // Em um ambiente real, envie o token por email/discord. Aqui, retornamos para facilitar dev.
  res.json({ ok: true, devToken: token });
});

router.post('/reset-password', async (req, res) => {
  const schema = z.object({ token: z.string(), newPassword: z.string().min(8) });
  const { token, newPassword } = schema.parse(req.body);
  const token_hash = crypto.createHash('sha256').update(token).digest('hex');
  const reset = await prisma.passwordReset.findFirst({ where: { token_hash, used: false, expires_at: { gt: new Date() } } });
  if (!reset) return res.status(400).json({ error: 'Invalid or expired token' });
  const password_hash = await hashPassword(newPassword);
  await prisma.$transaction([
    prisma.user.update({ where: { id: reset.user_id }, data: { password_hash, must_change_password: false } }),
    prisma.passwordReset.update({ where: { id: reset.id }, data: { used: true } }),
  ]);
  res.json({ ok: true });
});

export default router;
