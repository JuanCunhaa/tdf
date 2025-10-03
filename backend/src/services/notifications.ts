import { prisma } from '../prisma';

export async function notify(recipientId: string, type: 'FORM_STATUS' | 'GOAL_STATUS' | 'SYSTEM', title: string, message: string) {
  await prisma.notification.create({
    data: {
      recipient_id: recipientId,
      type,
      title,
      message,
    },
  });
}

