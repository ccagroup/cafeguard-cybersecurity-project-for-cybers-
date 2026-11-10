import { Router } from "express";
import { z } from "zod";
import { prisma } from "../db";
import { writeAudit } from "../audit";

export const incidentsRouter = Router();

const createSchema = z.object({
  stationId: z.string().min(1, "Choose a station").max(64),
  type: z.enum(["UNAUTHORISED_ACCESS", "PASSWORD_CHANGED", "OTHER"], {
    error: "Choose an incident type",
  }),
  description: z
    .string()
    .trim()
    .min(10, "Describe what happened (at least 10 characters)")
    .max(2000, "Description is too long"),
  severity: z.enum(["LOW", "MEDIUM", "HIGH"], { error: "Choose a severity" }),
});

const statusSchema = z.object({
  status: z.enum(["OPEN", "INVESTIGATING", "RESOLVED"], {
    error: "Choose a valid status",
  }),
});

const notesSchema = z.object({
  notes: z.string().max(5000, "Notes are too long (5000 characters maximum)"),
});

const include = {
  station: { select: { id: true, label: true } },
  reportedBy: { select: { name: true } },
};

type IncidentRow = {
  id: string;
  type: string;
  description: string;
  severity: string;
  status: string;
  notes: string | null;
  createdAt: Date;
  station: { id: string; label: string };
  reportedBy: { name: string };
};

function toDto(i: IncidentRow) {
  return {
    id: i.id,
    station: i.station,
    type: i.type,
    description: i.description,
    severity: i.severity,
    status: i.status,
    notes: i.notes ?? "",
    reportedBy: i.reportedBy.name,
    createdAt: i.createdAt,
  };
}

incidentsRouter.get("/", async (_req, res) => {
  const incidents = await prisma.incident.findMany({
    orderBy: [{ createdAt: "desc" }, { id: "desc" }],
    take: 200,
    include,
  });
  res.json({ incidents: incidents.map(toDto) });
});

incidentsRouter.post("/", async (req, res) => {
  const parsed = createSchema.safeParse(req.body);
  if (!parsed.success) {
    return res
      .status(400)
      .json({ error: "Check the form", fields: parsed.error.flatten().fieldErrors });
  }
  const { stationId, type, description, severity } = parsed.data;

  const station = await prisma.station.findUnique({ where: { id: stationId } });
  if (!station) {
    return res
      .status(400)
      .json({ error: "Check the form", fields: { stationId: ["Station not found"] } });
  }

  const incident = await prisma.$transaction(async (tx) => {
    const created = await tx.incident.create({
      data: {
        stationId,
        type,
        description,
        severity,
        reportedById: req.user!.id,
      },
      include,
    });
    await writeAudit(tx, {
      actorId: req.user!.id,
      action: "incident created",
      target: created.id,
      stationId,
      detail: `${type} (${severity}) on ${station.label}`,
      ip: req.ip ?? null,
    });
    return created;
  });

  res.status(201).json({ incident: toDto(incident) });
});

incidentsRouter.get("/:id", async (req, res) => {
  const incident = await prisma.incident.findUnique({
    where: { id: req.params.id },
    include,
  });
  if (!incident) return res.status(404).json({ error: "Incident not found" });

  const from = new Date(incident.createdAt.getTime() - 4 * 60 * 60 * 1000);
  const to = new Date(incident.createdAt.getTime() + 2 * 60 * 60 * 1000);

  const [audits, sessions] = await Promise.all([
    prisma.auditLog.findMany({
      where: { stationId: incident.stationId, createdAt: { gte: from, lte: to } },
      orderBy: { createdAt: "asc" },
      take: 200,
      include: { actor: { select: { name: true } } },
    }),
    prisma.customerSession.findMany({
      where: {
        stationId: incident.stationId,
        startedAt: { lte: to },
        OR: [{ endedAt: null }, { endedAt: { gte: from } }],
      },
      orderBy: { startedAt: "asc" },
      take: 50,
      include: {
        startedBy: { select: { name: true } },
        endedBy: { select: { name: true } },
      },
    }),
  ]);

  const items = [
    ...audits.map((a) => ({
      kind: "audit" as const,
      at: a.createdAt,
      title: a.action,
      detail: a.detail,
      actor: a.actor?.name ?? null,
      session: null,
    })),
    ...sessions.map((s) => ({
      kind: "session" as const,
      at: s.startedAt,
      title: "Customer session",
      detail: s.customerName,
      actor: s.startedBy.name,
      session: {
        customerName: s.customerName,
        startedAt: s.startedAt,
        endedAt: s.endedAt,
        endedProperly: s.endedProperly,
        endedBy: s.endedBy?.name ?? null,
      },
    })),
  ].sort((a, b) => a.at.getTime() - b.at.getTime());

  res.json({ incident: toDto(incident), timeline: { from, to, items } });
});

incidentsRouter.patch("/:id/status", async (req, res) => {
  const parsed = statusSchema.safeParse(req.body);
  if (!parsed.success) {
    return res
      .status(400)
      .json({ error: "Check the form", fields: parsed.error.flatten().fieldErrors });
  }
  const { status } = parsed.data;
  const id = req.params.id;

  const result = await prisma.$transaction(async (tx) => {
    const current = await tx.incident.findUnique({ where: { id }, include });
    if (!current) return null;
    if (current.status === status) return current;

    const updated = await tx.incident.update({ where: { id }, data: { status }, include });
    await writeAudit(tx, {
      actorId: req.user!.id,
      action: "incident status changed",
      target: id,
      stationId: current.stationId,
      detail: `${current.status} -> ${status}`,
      ip: req.ip ?? null,
    });
    return updated;
  });

  if (!result) return res.status(404).json({ error: "Incident not found" });
  res.json({ incident: toDto(result) });
});

incidentsRouter.put("/:id/notes", async (req, res) => {
  const parsed = notesSchema.safeParse(req.body);
  if (!parsed.success) {
    return res
      .status(400)
      .json({ error: "Check the form", fields: parsed.error.flatten().fieldErrors });
  }
  const { notes } = parsed.data;
  const id = req.params.id;

  const result = await prisma.$transaction(async (tx) => {
    const current = await tx.incident.findUnique({ where: { id } });
    if (!current) return null;

    const updated = await tx.incident.update({ where: { id }, data: { notes }, include });
    await writeAudit(tx, {
      actorId: req.user!.id,
      action: "notes saved",
      target: id,
      stationId: current.stationId,
      detail: `${notes.length} characters`,
      ip: req.ip ?? null,
    });
    return updated;
  });

  if (!result) return res.status(404).json({ error: "Incident not found" });
  res.json({ incident: toDto(result) });
});