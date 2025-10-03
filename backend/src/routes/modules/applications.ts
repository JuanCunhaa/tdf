import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../../prisma';
import { ApplicationStatus } from '@prisma/client';
import { requireAuth, requireRole } from '../../middleware/auth';
import { generateTempPassword, hashPassword } from '../../utils/password';
import { logAudit } from '../../services/audit';
import { notify } from '../../services/notifications';
import { sendDiscordWebhook, buildRecruitmentEmbed } from '../../services/discord';
import { sanitizeText } from '../../utils/sanitize';
import jwt from 'jsonwebtoken';
import { env } from '../../config/env';

const router = Router();

const applicationSchema = z.object({
  nickname: z
    .string()
    .min(3)
    .max(32)
    .regex(/^[A-Za-z0-9._-]+$/, 'Nickname inválido'),
  real_name: z.string().min(2),
  discord_tag: z
    .string()
    .min(2)
    .max(64)
    .regex(/^[A-Za-z0-9 ._#\-]+$/, 'Discord inválido'),
  age: z.coerce.number().int().min(10).max(120),
  country: z
    .string()
    .min(2)
    .max(64)
    .regex(/^[A-Za-zÀ-ÿ .\-]+$/u, 'País inválido'),
  focus_area: z.enum(['MINERACAO','FARM','SAQUE']),
  prior_clans: z.string().optional(),
  motivation: z.string().min(5),
  daily_play_hours: z.coerce.number().int().min(1).max(18).optional(),
  accepts_rules: z.boolean().refine((v) => v === true, 'Deve aceitar as regras'),
  portfolio_links: z.string().optional(),
  challenge_input: z.string().min(3),
  challenge_token: z.string().min(10),
});

// Public submission
router.post('/', async (req, res) => {
  const data = applicationSchema.parse(req.body);
  try {
    const decoded = jwt.verify(data.challenge_token, env.JWT_SECRET) as any;
    const code = String(decoded.code || '').toUpperCase();
    if (code !== data.challenge_input.trim().toUpperCase()) {
      return res.status(400).json({ error: 'Desafio inválido' });
    }
  } catch {
    return res.status(400).json({ error: 'Desafio inválido/expirado' });
  }

  const app = await prisma.recruitmentApplication.create({ data: {
    nickname: sanitizeText(data.nickname, 32)!,
    real_name: sanitizeText(data.real_name, 64)!,
    discord_tag: sanitizeText(data.discord_tag, 64)!,
    age: data.age,
    country: sanitizeText(data.country, 64)!,
    focus_area: sanitizeText(data.focus_area, 16)!,
    prior_clans: sanitizeText(data.prior_clans || null, 300),
    motivation: sanitizeText(data.motivation, 800)!,
    daily_play_hours: data.daily_play_hours ?? null,
    accepts_rules: data.accepts_rules,
    portfolio_links: sanitizeText(data.portfolio_links || null, 500),
  } });
  res.status(201).json({ id: app.id, created_at: app.created_at });
});

// Challenge endpoint
router.get('/challenge', async (_req, res) => {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 6; i++) code += alphabet[Math.floor(Math.random() * alphabet.length)];
  const token = jwt.sign({ code }, env.JWT_SECRET, { expiresIn: '5m' });
  res.json({ code, token });
});

// List (admin)
router.get('/', requireAuth, requireRole('ADMIN', 'ELITE', 'LEADER'), async (req, res) => {
  const statusParam = req.query.status as string | undefined;
  const status: ApplicationStatus = (statusParam && ['PENDING','ACCEPTED','REJECTED'].includes(statusParam))
    ? (statusParam as ApplicationStatus)
    : 'PENDING';
  const list = await prisma.recruitmentApplication.findMany({
    where: { status },
    select: { id: true, nickname: true, discord_tag: true, created_at: true, status: true },
    orderBy: { created_at: 'desc' },
  });
  res.json({ applications: list });
});

router.get('/:id', requireAuth, requireRole('ADMIN', 'ELITE', 'LEADER'), async (req, res) => {
  const app = await prisma.recruitmentApplication.findUnique({ where: { id: req.params.id } });
  if (!app) return res.status(404).json({ error: 'Application not found' });
  res.json({ application: app });
});

router.post('/:id/accept', requireAuth, requireRole('ADMIN', 'ELITE', 'LEADER'), async (req, res) => {
  const reviewerId = (req as any).user.sub as string;
  const app = await prisma.recruitmentApplication.findUnique({ where: { id: req.params.id } });
  if (!app) return res.status(404).json({ error: 'Application not found' });
  if (app.status !== 'PENDING') return res.status(400).json({ error: 'Already reviewed' });

  const tempPassword = generateTempPassword();
  const password_hash = await hashPassword(tempPassword);

  const user = await prisma.$transaction(async (tx) => {
    const created = await tx.user.create({
      data: {
        nickname: app.nickname,
        discord_tag: app.discord_tag,
        email: null,
        password_hash,
        role: 'MEMBER',
        status: 'ACTIVE',
        must_change_password: true,
        joined_at: new Date(),
      },
    });
    await tx.recruitmentApplication.update({
      where: { id: app.id },
      data: { status: 'ACCEPTED', reviewed_by: reviewerId, reviewed_at: new Date(), accepted_user_id: created.id },
    });
    return created;
  });

  await logAudit({ actorId: reviewerId, action: 'FORM_ACCEPTED', entity: 'RECRUITMENT_APPLICATION', entityId: app.id, metadata: { accepted_user_id: user.id, nickname: user.nickname } });
  await notify(user.id, 'FORM_STATUS', 'Bem-vindo ao TDF!', 'Sua aplicação foi aceita. Troque sua senha no primeiro login.');

  try {
    const reviewer = await prisma.user.findUnique({ where: { id: reviewerId }, select: { nickname: true, discord_tag: true } });
    const { env } = require('../../config/env');
    const payload = (require('../../services/discord') as any).buildRecruitmentEmbed({ status: 'ACCEPTED', applicantNick: app.nickname, applicantDiscord: app.discord_tag, reviewer: reviewer?.discord_tag || reviewer?.nickname || 'Equipe' });
    if (env.DISCORD_RECRUITMENT_WEBHOOK) await (require('../../services/discord') as any).sendDiscordWebhook(env.DISCORD_RECRUITMENT_WEBHOOK, payload);
  } catch {}
  res.json({ ok: true, user: { id: user.id, nickname: user.nickname, role: user.role }, temporaryPassword: tempPassword });
});

router.post('/:id/reject', requireAuth, requireRole('ADMIN', 'ELITE', 'LEADER'), async (req, res) => {
  const reviewerId = (req as any).user.sub as string;
  const reason = (req.body?.reason as string) || '';
  const app = await prisma.recruitmentApplication.findUnique({ where: { id: req.params.id } });
  if (!app) return res.status(404).json({ error: 'Application not found' });
  if (app.status !== 'PENDING') return res.status(400).json({ error: 'Already reviewed' });
  await prisma.recruitmentApplication.update({ where: { id: app.id }, data: { status: 'REJECTED', reviewed_by: reviewerId, reviewed_at: new Date() } });
  await logAudit({ actorId: reviewerId, action: 'FORM_REJECTED', entity: 'RECRUITMENT_APPLICATION', entityId: app.id, metadata: { reason } });
  try {
    const reviewer = await prisma.user.findUnique({ where: { id: reviewerId }, select: { nickname: true, discord_tag: true } });
    const { env } = require('../../config/env');
    const payload = (require('../../services/discord') as any).buildRecruitmentEmbed({ status: 'REJECTED', applicantNick: app.nickname, applicantDiscord: app.discord_tag, reviewer: reviewer?.discord_tag || reviewer?.nickname || 'Equipe', reason });
    if (env.DISCORD_RECRUITMENT_WEBHOOK) await (require('../../services/discord') as any).sendDiscordWebhook(env.DISCORD_RECRUITMENT_WEBHOOK, payload);
  } catch {}
  res.json({ ok: true });
});

export default router;




