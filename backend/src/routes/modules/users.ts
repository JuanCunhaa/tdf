import { Router } from 'express';
import { prisma } from '../../prisma';
import { requireAuth, requireRole } from '../../middleware/auth';
import { z } from 'zod';
import { generateTempPassword, hashPassword } from '../../utils/password';
import { sanitizeText } from '../../utils/sanitize';
import { logAudit } from '../../services/audit';

const router = Router();

router.get('/', requireAuth, requireRole('ADMIN', 'ELITE', 'LEADER'), async (req, res) => {
  const role = (req.query.role as string) || undefined;
  const status = (req.query.status as string) || undefined;
  const users = await prisma.user.findMany({
    where: {
      role: role as any,
      status: status as any,
    },
    select: { id: true, nickname: true, discord_tag: true, email: true, role: true, status: true, joined_at: true, created_at: true },
    orderBy: { created_at: 'desc' },
  });
  res.json({ users });
});

router.post('/', requireAuth, requireRole('ADMIN', 'LEADER'), async (req, res) => {
  const schema = z.object({
    nickname: z
      .string()
      .min(3)
      .max(32)
      .regex(/^[A-Za-z0-9._-]+$/, 'Nickname inválido'),
    discord_tag: z
      .string()
      .min(2)
      .max(64)
      .regex(/^[A-Za-z0-9 ._#\-]+$/, 'Discord inválido'),
    email: z.string().email().nullable().optional(),
    role: z.enum(['LEADER','ELITE','ADMIN','MEMBER']).default('MEMBER'),
  });
  const body = schema.parse(req.body);
  const temp = generateTempPassword();
  const password_hash = await hashPassword(temp);
  const created = await prisma.user.create({ data: {
    nickname: body.nickname,
    discord_tag: body.discord_tag,
    email: body.email ?? null,
    password_hash,
    role: body.role,
    status: 'ACTIVE',
    must_change_password: true,
    joined_at: new Date(),
  }});
  res.status(201).json({ user: { id: created.id, nickname: created.nickname, role: created.role }, temporaryPassword: temp });
});

router.patch('/:id/role', requireAuth, requireRole('LEADER'), async (req, res) => {
  const schema = z.object({ role: z.enum(['LEADER', 'ELITE', 'ADMIN', 'MEMBER']) });
  const { role } = schema.parse(req.body);
  const u = await prisma.user.update({ where: { id: req.params.id }, data: { role } });
  await logAudit({ actorId: (req as any).user.sub, action: 'USER_ROLE_CHANGED', entity: 'USER', entityId: u.id, metadata: { role } });
  res.json({ id: u.id, role: u.role });
});

router.patch('/:id/status', requireAuth, requireRole('LEADER', 'ELITE', 'ADMIN'), async (req, res) => {
  const schema = z.object({ status: z.enum(['ACTIVE', 'INACTIVE', 'BANNED']) });
  const { status } = schema.parse(req.body);
  const u = await prisma.user.update({ where: { id: req.params.id }, data: { status } });
  await logAudit({ actorId: (req as any).user.sub, action: 'USER_STATUS_CHANGED', entity: 'USER', entityId: u.id, metadata: { status } });
  res.json({ id: u.id, status: u.status });
});

router.post('/:id/reset-password', requireAuth, requireRole('ADMIN', 'ELITE', 'LEADER'), async (req, res) => {
  const temp = generateTempPassword();
  const password_hash = await hashPassword(temp);
  await prisma.user.update({ where: { id: req.params.id }, data: { password_hash, must_change_password: true } });
  await logAudit({ actorId: (req as any).user.sub, action: 'USER_PASSWORD_RESET', entity: 'USER', entityId: req.params.id });
  res.json({ ok: true, temporaryPassword: temp });
});

router.get('/export.csv', requireAuth, requireRole('ADMIN', 'ELITE', 'LEADER'), async (_req, res) => {
  const users = await prisma.user.findMany({ orderBy: { created_at: 'desc' } });
  const header = 'id,nickname,discord_tag,email,role,status,joined_at,created_at\n';
  const rows = users
    .map((u) => [u.id, u.nickname, u.discord_tag, u.email ?? '', u.role, u.status, u.joined_at?.toISOString() ?? '', u.created_at.toISOString()].map((v) => `"${String(v).replaceAll('"', '""')}"`).join(','))
    .join('\n');
  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', 'attachment; filename="users.csv"');
  res.send(header + rows + '\n');
});

// Delete (deactivate) user — LEADER only
router.delete('/:id', requireAuth, requireRole('LEADER', 'ELITE', 'ADMIN'), async (req, res) => {
  const u = await prisma.user.update({ where: { id: req.params.id }, data: { status: 'INACTIVE' } });
  await logAudit({ actorId: (req as any).user.sub, action: 'USER_DEACTIVATED', entity: 'USER', entityId: u.id });
  res.json({ ok: true });
});

// Self update
router.patch('/me', requireAuth, async (req, res) => {
  const schema = z.object({ discord_tag: z.string().optional(), email: z.string().email().nullable().optional() });
  const body = schema.parse(req.body);
  const meId = (req as any).user.sub as string;
  const sanitizedDiscord = sanitizeText(body.discord_tag ?? null, 64) ?? undefined;
  const u = await prisma.user.update({ where: { id: meId }, data: { discord_tag: sanitizedDiscord, email: body.email ?? undefined } });
  res.json({ user: { id: u.id, nickname: u.nickname, discord_tag: u.discord_tag, email: u.email } });
});

export default router;
