import type { Prisma } from "@prisma/client";

export type AuditInput = {
  actorId?: string | null;
  action: string;
  target?: string | null;
  stationId?: string | null;
  detail?: string | null;
  ip?: string | null;
};

export function writeAudit(tx: Prisma.TransactionClient, e: AuditInput) {
  return tx.auditLog.create({
    data: {
      actorId: e.actorId ?? null,
      action: e.action,
      target: e.target ?? null,
      stationId: e.stationId ?? null,
      detail: e.detail ? e.detail.slice(0, 500) : null,
      ip: e.ip ?? null,
    },
  });
}