import { env } from '../config/env';

export async function sendDiscordMessage(message: string) {
  if (!env.DISCORD_BOT_TOKEN || !env.DISCORD_CHANNEL_ID) {
    // Not configured; noop
    return;
  }
  // Lightweight call via Discord API without full SDK
  try {
    await fetch(`https://discord.com/api/v10/channels/${env.DISCORD_CHANNEL_ID}/messages`, {
      method: 'POST',
      headers: {
        'Authorization': `Bot ${env.DISCORD_BOT_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ content: message }),
    });
  } catch (e) {
    console.warn('Discord send failed:', (e as Error).message);
  }
}

export async function sendDiscordWebhook(url: string, payload: any) {
  try {
    await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
  } catch (e) {
    console.warn('Discord webhook failed:', (e as Error).message);
  }
}

export function buildRecruitmentEmbed(params: { status: 'ACCEPTED'|'REJECTED'; applicantNick: string; applicantDiscord: string; reviewer: string; reason?: string; }) {
  const color = params.status === 'ACCEPTED' ? 0x2ecc71 : 0xe74c3c;
  const title = params.status === 'ACCEPTED' ? 'Recrutamento: Aprovado' : 'Recrutamento: Recusado';
  const fields: any[] = [
    { name: 'Nick', value: params.applicantNick, inline: true },
    { name: 'Status', value: params.status === 'ACCEPTED' ? 'Aprovado' : 'Recusado', inline: true },
    { name: 'Revisor', value: params.reviewer, inline: true },
  ];
  if (params.status === 'REJECTED') {
    fields.push({ name: 'Mensagem', value: params.reason?.trim() ? params.reason : 'Tente novamente em uma próxima ocasião.' });
  } else {
    fields.push({ name: 'Próximos passos', value: `Entre em contato com ${params.reviewer} para receber seu acesso ao clã.` });
  }
  const embed = { title, color, fields, timestamp: new Date().toISOString() };

  // Try to mention by ID if applicantDiscord is a numeric ID
  const idMatch = params.applicantDiscord && /^\d{17,20}$/.test(params.applicantDiscord.trim()) ? params.applicantDiscord.trim() : null;
  const content = idMatch ? `<@${idMatch}>` : `@${params.applicantDiscord}`;
  const allowed_mentions = idMatch ? { users: [idMatch] } : { parse: [] as string[] };
  return { content, allowed_mentions, embeds: [embed] };
}
