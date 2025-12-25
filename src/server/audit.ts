import { prisma } from "@/server/db";
import { getRequestMetaAsync } from "@/server/session";

export async function logAudit(input: {
  action: string;
  entityType: string;
  entityId?: string;
  adminUserId?: string;
  metadata?: Record<string, unknown>;
}) {
  const meta = await getRequestMetaAsync();
  await prisma.auditLog.create({
    data: {
      action: input.action,
      entityType: input.entityType,
      entityId: input.entityId,
      ip: meta.ip,
      userAgent: meta.userAgent,
      adminUserId: input.adminUserId,
      metadataJson: input.metadata ? JSON.stringify(input.metadata) : undefined,
    },
  });
}

