import { Router } from "express";
import type { Prisma } from "@prisma/client";
import { z } from "zod";
import { prisma } from "../db";

export const auditRouter = Router();

const querySchema = z.object({
  q: z.string().trim().max(100).optional(),
  limit: z.coerce.number().int().min(1).max(500).default(100),
});

auditRouter.get("/", async (req, res) => {
  const parsed = querySchema.safeParse(req.query);
  if (!parsed.success) return res.status(400).json({ error: "Invalid search" });
  const { q, limit } = parsed.data;

  const stations = await prisma.station.findMany({ select: { id: true, label: true } });
  const labelById = new Map(stations.map((s) => [s.id, s.label]));

  let where: Prisma.AuditLogWhereInput = {};
  if (q) {
    const or: Prisma.AuditLogWhereInput[] = [
      { action: { contains: q } },
      { target: { contains: q } },
      { detail: { contains: q } },
      { ip: { contains: q } },
      { actor: { is: { OR: [{ name: { contains: q } }, { email: { contains: q } }] } } },
    ];
    const matchingStations = stations.filter((s) =>
      s.label.toLowerCase().includes(q.toLowerCase())
    );
    if (matchingStations.length) {
      or.push({ stationId: { in: matchingStations.map((s) => s.id) } });
    }
    if (/^\d{4}-\d{2}-\d{2}$/.test(q)) {
      const start = new Date(`${q}T00:00:00`);
      if (!Number.isNaN(start.getTime())) {
        or.push({
          createdAt: { gte: start, lt: new Date(start.getTime() + 24 * 60 * 60 * 1000) },
        });
      }
    }
    where = { OR: or };
  }

  const rows = await prisma.auditLog.findMany({
    where,
    orderBy: [{ createdAt: "desc" }, { id: "desc" }],
    take: limit,
    include: { actor: { select: { name: true, email: true } } },
  });

  res.json({
    entries: rows.map((r) => ({
      id: r.id.toString(),
      at: r.createdAt,
      actor: r.actor?.name ?? null,
      actorEmail: r.actor?.email ?? null,
      action: r.action,
      target: r.target,
      station: r.stationId ? (labelById.get(r.stationId) ?? null) : null,
      detail: r.detail,
      ip: r.ip,
    })),
  });
});