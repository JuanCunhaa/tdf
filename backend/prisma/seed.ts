import 'dotenv/config';
import { prisma } from '../src/prisma';
import { hashPassword } from '../src/utils/password';

async function main() {
  console.log('Seeding database...');

  const leaderPass = 'Leader#1234';
  const adminPass = 'Admin#1234';
  const elitePass = 'Elite#1234';
  const memberPass = 'Member#1234';

  const [leader, elite, admin, member] = await Promise.all([
    prisma.user.upsert({
      where: { nickname: 'Noel' },
      update: {},
      create: {
        nickname: 'Noel',
        discord_tag: 'Noel#0001',
        email: 'leader@tdf.gg',
        password_hash: await hashPassword(leaderPass),
        must_change_password: false,
        role: 'LEADER',
        status: 'ACTIVE',
        joined_at: new Date(),
      },
    }),
    prisma.user.upsert({
      where: { nickname: 'Elite01' },
      update: {},
      create: {
        nickname: 'Elite01',
        discord_tag: 'Elite01#0002',
        email: 'elite01@tdf.gg',
        password_hash: await hashPassword(elitePass),
        must_change_password: true,
        role: 'ELITE',
        status: 'ACTIVE',
        joined_at: new Date(),
      },
    }),
    prisma.user.upsert({
      where: { nickname: 'Mod01' },
      update: {},
      create: {
        nickname: 'Mod01',
        discord_tag: 'Mod01#0003',
        email: 'admin@tdf.gg',
        password_hash: await hashPassword(adminPass),
        must_change_password: false,
        role: 'ADMIN',
        status: 'ACTIVE',
        joined_at: new Date(),
      },
    }),
    prisma.user.upsert({
      where: { nickname: 'Player01' },
      update: {},
      create: {
        nickname: 'Player01',
        discord_tag: 'Player01#0004',
        email: 'player01@tdf.gg',
        password_hash: await hashPassword(memberPass),
        must_change_password: true,
        role: 'MEMBER',
        status: 'ACTIVE',
        joined_at: new Date(),
      },
    }),
  ]);

  await prisma.achievement.createMany({
    data: [
      { code: 'FIRST_GOAL', name: 'Primeira meta batida', description: 'Concluiu a primeira meta', points: 10 },
      { code: 'TEN_GOALS', name: '10 metas concluídas', description: 'Concluiu dez metas', points: 50 },
      { code: 'DIAMOND_MINER', name: 'Minerou 10k diamantes', description: 'Farmou 10.000 diamantes', points: 100 },
    ],
    skipDuplicates: true,
  });

  const goal1 = await prisma.goal.upsert({
    where: { id: '00000000-0000-0000-0000-000000000001' },
    update: {},
    create: {
      id: '00000000-0000-0000-0000-000000000001',
      title: 'Farmar 50k blocos de pedra',
      description: 'Coletar 50.000 blocos de pedra para o estoque do clã.',
      type: 'FARM',
      target_amount: 50000,
      unit: 'blocos',
      visibility: 'CLAN',
      status: 'ACTIVE',
      created_by: leader.id,
    },
  });

  const goal2 = await prisma.goal.upsert({
    where: { id: '00000000-0000-0000-0000-000000000002' },
    update: {},
    create: {
      id: '00000000-0000-0000-0000-000000000002',
      title: 'Construir Muralha Norte',
      description: 'Projeto de construção da Muralha Norte da base TDF.',
      type: 'BUILD',
      visibility: 'CLAN',
      status: 'ACTIVE',
      created_by: admin.id,
    },
  });

  const award = await prisma.award.upsert({
    where: { id: '00000000-0000-0000-0000-0000000000aa' },
    update: {},
    create: {
      id: '00000000-0000-0000-0000-0000000000aa',
      title: 'Top #1 Economy – Julho/2025',
      description: 'Conquista máxima em economia no mês.',
      tier: 'GOLD',
      category: 'ECONOMY',
      achieved_on: new Date('2025-07-28'),
    },
  });

  console.log('Seed concluído. Credenciais de exemplo:');
  console.log(`LEADER Noel / ${leaderPass}`);
  console.log(`ADMIN Mod01 / ${adminPass}`);
  console.log(`ELITE Elite01 / ${elitePass}`);
  console.log(`MEMBER Player01 / ${memberPass}`);
}

main().then(() => process.exit(0)).catch((e) => {
  console.error(e);
  process.exit(1);
});

