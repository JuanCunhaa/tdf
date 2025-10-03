import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../../prisma';
import { ApplicationStatus } from '@prisma/client';
import { requireAuth, requireRole } from '../../middleware/auth';
import { generateTempPassword, hashPassword } from '../../utils/password';
import { logAudit } from '../../services/audit';
import { notify } from '../../services/notifications';
import { sendDiscordMessage } from '../../services/discord';

const router = Router();

const applicationSchema = z.object({
  nickname: z.string().min(3),
  discord_tag: z.string().min(2),
  age: z.coerce.number().int().min(10),
  region: z.string().min(2),
  mc_experience: z.string().min(2),
  highest_rank: z.string().min(1),
  preferences: z.string().min(1),
  weekly_hours: z.coerce.number().int().min(0),
  prior_clan: z.boolean(),
  why_left_prior_clan: z.string().optional(),
  why_join_us: z.string().min(5),
  accepts_rules: z.boolean().refine((v) => v === true, 'Deve aceitar as regras'),
  portfolio_links: z.string().optional(),
  attention_word: z.string().refine((v) => v.trim().toUpperCase() === 'RANKUP', 'Palavra de atenção inválida'),
});

// Public submission
router.post('/', async (req, res) => {
  const data = applicationSchema.parse(req.body);
  const app = await prisma.recruitmentApplication.create({ data });
  res.status(201).json({ id: app.id, created_at: app.created_at });
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
  await sendDiscordMessage(`🎉 Novo membro entrou no clã: ${user.nickname}`);

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
  res.json({ ok: true });
});

export default router;
