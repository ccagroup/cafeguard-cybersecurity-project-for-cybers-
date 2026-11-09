import { Router } from "express";
import { z } from "zod";
import { prisma } from "../db";
import { writeAudit } from "../audit";
import { requireRole } from "../middleware/auth";

export const sessionsRouter = Router();

const endSchema = z.object({
  checklist: z.object({
    loggedOut: z.literal(true),
    browserCleared: z.literal(true),
    noPasswordsSaved: z.literal(true),
  }),
});

async function endSession(opts: {
  id: string;
  userId: string;
  proper: boolean;
  action: string;
  detail: string;
  ip: string | null;
}) {
  return prisma.$transaction(async (tx) => {
    const updated = await tx.customerSession.updateMany({
      where: { id: opts.id, endedAt: null },
      data: {
        endedAt: new Date(),
        endedById: opts.userId,
        endedProperly: opts.proper,
        openStationKey: null,
      },
    });
    if (updated.count === 0) return null;

    const s = await tx.customerSession.findUniqueOrThrow({ where: { id: opts.id } });
    await writeAudit(tx, {
      actorId: opts.userId,
      action: opts.action,
      target: s.id,
      stationId: s.stationId,
      detail: opts.detail,
      ip: opts.ip,
    });
    return s;
  });
}

sessionsRouter.post("/:id/end", async (req, res) => {
  const parsed = endSchema.safeParse(req.body);
  if (!parsed.success) {
    return res
      .status(400)
      .json({ error: "Tick all three checklist items before ending the session" });
  }
  const session = await endSession({
    id: req.params.id,
    userId: req.user!.id,
    proper: true,
    action: "session end",
    detail: "Checklist completed",
    ip: req.ip ?? null,
  });
  if (!session) {
    return res.status(404).json({ error: "Session not found or already ended" });
  }
  res.json({ session });
});

sessionsRouter.post("/:id/force-end", requireRole("ADMIN"), async (req, res) => {
  const session = await endSession({
    id: String(req.params.id),
    userId: req.user!.id,
    proper: false,
    action: "session end",
    detail: "Ended by Admin without the checklist",
    ip: req.ip ?? null,
  });
  if (!session) {
    return res.status(404).json({ error: "Session not found or already ended" });
  }
  res.json({ session });
});