import { Router } from "express";
import { z } from "zod";
import { prisma } from "../db";
import { writeAudit } from "../audit";
import { isUniqueViolation } from "../prismaErrors";

export const stationsRouter = Router();

const startSchema = z.object({
  customerName: z
    .string()
    .trim()
    .min(1, "Customer name is required")
    .max(100, "Customer name is too long"),
});

stationsRouter.get("/", async (_req, res) => {
  const stations = await prisma.station.findMany({
    orderBy: { label: "asc" },
    include: {
      sessions: {
        where: { endedAt: null },
        take: 1,
        include: { startedBy: { select: { name: true } } },
      },
    },
  });

  res.json({
    stations: stations.map((s) => {
      const open = s.sessions[0];
      return {
        id: s.id,
        label: s.label,
        status: open ? "IN_USE" : "FREE",
        openSession: open
          ? {
              id: open.id,
              customerName: open.customerName,
              startedAt: open.startedAt,
              startedBy: open.startedBy.name,
            }
          : null,
      };
    }),
  });
});

stationsRouter.post("/:id/sessions", async (req, res) => {
  const parsed = startSchema.safeParse(req.body);
  if (!parsed.success) {
    return res
      .status(400)
      .json({ error: "Check the form", fields: parsed.error.flatten().fieldErrors });
  }
  const { customerName } = parsed.data;

  const station = await prisma.station.findUnique({ where: { id: req.params.id } });
  if (!station) return res.status(404).json({ error: "Station not found" });

  try {
    const session = await prisma.$transaction(async (tx) => {
      const s = await tx.customerSession.create({
        data: {
          stationId: station.id,
          customerName,
          startedById: req.user!.id,
          openStationKey: station.id,
        },
      });
      await writeAudit(tx, {
        actorId: req.user!.id,
        action: "session start",
        target: s.id,
        stationId: station.id,
        detail: `${station.label} for ${customerName}`,
        ip: req.ip ?? null,
      });
      return s;
    });
    res.status(201).json({ session });
  } catch (e) {
    if (isUniqueViolation(e)) {
      return res
        .status(409)
        .json({ error: `${station.label} already has an open session. End it first.` });
    }
    throw e;
  }
});