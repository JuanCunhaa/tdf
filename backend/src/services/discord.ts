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

