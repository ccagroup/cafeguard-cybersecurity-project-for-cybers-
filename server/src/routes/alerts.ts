import { Router } from "express";
import { z } from "zod";
import { prisma } from "../db";
import { writeAudit } from "../audit";

export const alertsRouter = Router();

type AlertRow = {
  id: string;
  severity: string;
  message: string;
  createdAt: Date;
  acknowledgedAt: Date | null;
  station: { id: string; label: string };
  acknowledgedBy: { name: string } | null;
};

function toDto(a: AlertRow) {
  return {
    id: a.id,
    severity: a.severity,
    message: a.message,
    station: a.station,
    createdAt: a.createdAt,
    acknowledgedAt: a.acknowledgedAt,
    acknowledgedBy: a.acknowledgedBy?.name ?? null,
  };
}

const include = {
  station: { select: { id: true, label: true } },
  acknowledgedBy: { select: { name: true } },
};

const listSchema = z.object({
  status: z.enum(["open", "all"]).default("all"),
  limit: z.coerce.number().int().min(1).max(200).default(50),
});

alertsRouter.get("/", async (req, res) => {
  const q = listSchema.safeParse(req.query);
  if (!q.success) return res.status(400).json({ error: "Invalid filter" });

  const alerts = await prisma.alert.findMany({
    where: q.data.status === "open" ? { acknowledgedAt: null } : {},
    orderBy: { createdAt: "desc" },
    take: q.data.limit,
    include,
  });
  res.json({ alerts: alerts.map(toDto) });
});

alertsRouter.post("/:id/acknowledge", async (req, res) => {
  const id = req.params.id;

  const result = await prisma.$transaction(async (tx) => {
    const updated = await tx.alert.updateMany({
      where: { id, acknowledgedAt: null },
      data: { acknowledgedAt: new Date(), acknowledgedById: req.user!.id },
    });
    if (updated.count === 0) return null;

    const a = await tx.alert.findUniqueOrThrow({ where: { id }, include });
    await writeAudit(tx, {
      actorId: req.user!.id,
      action: "alert acknowledged",
      target: id,
      stationId: a.stationId,
      detail: a.message,
      ip: req.ip ?? null,
    });
    return a;
  });

  if (!result) {
    const exists = await prisma.alert.findUnique({ where: { id }, select: { id: true } });
    return exists
      ? res.status(409).json({ error: "This alert was already acknowledged" })
      : res.status(404).json({ error: "Alert not found" });
  }
  res.json({ alert: toDto(result) });
});