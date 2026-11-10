import type { AlertSeverity, Prisma } from "@prisma/client";
import { writeAudit } from "./audit";

export async function raiseAlert(
  tx: Prisma.TransactionClient,
  input: {
    severity: AlertSeverity;
    message: string;
    stationId: string;
    actorId: string;
    ip: string | null;
  }
) {
  const alert = await tx.alert.create({
    data: {
      severity: input.severity,
      message: input.message.slice(0, 500),
      stationId: input.stationId,
    },
  });
  await writeAudit(tx, {
    actorId: input.actorId,
    action: "alert raised",
    target: alert.id,
    stationId: input.stationId,
    detail: `${input.severity}: ${alert.message}`,
    ip: input.ip,
  });
  return alert;
}