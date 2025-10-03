import { prisma } from '../prisma';

export async function logAudit(params: {
  actorId: string;
  action: string;
  entity: string;
  entityId?: string | null;
  metadata?: any;
}) {
  await prisma.auditLog.create({
    data: {
      actor_id: params.actorId,
      action: params.action,
      entity: params.entity,
      entity_id: params.entityId ?? null,
      metadata: params.metadata ?? undefined,
    },
  });
}

