import { Router } from "express";
import { prisma } from "../db";
import { include as alertInclude, toDto as alertToDto } from "./alerts";

export const dashboardRouter = Router();

function localDay(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

dashboardRouter.get("/", async (_req, res) => {
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const chartStart = new Date(startOfToday);
  chartStart.setDate(chartStart.getDate() - 13);

  const [activeSessions, openIncidents, alertsToday, endedWithoutChecklist, recent, starts] =
    await Promise.all([
      prisma.customerSession.count({ where: { endedAt: null } }),
      prisma.incident.count({ where: { status: { not: "RESOLVED" } } }),
      prisma.alert.count({ where: { createdAt: { gte: startOfToday } } }),
      prisma.customerSession.count({
        where: { endedAt: { not: null }, endedProperly: false },
      }),
      prisma.alert.findMany({
        orderBy: [{ createdAt: "desc" }, { id: "desc" }],
        take: 8,
        include: alertInclude,
      }),
      prisma.customerSession.findMany({
        where: { startedAt: { gte: chartStart } },
        select: { startedAt: true },
      }),
    ]);

  const perDayCount = new Map<string, number>();
  for (const s of starts) {
    const key = localDay(s.startedAt);
    perDayCount.set(key, (perDayCount.get(key) ?? 0) + 1);
  }

  const sessionsPerDay = Array.from({ length: 14 }, (_, i) => {
    const d = new Date(chartStart);
    d.setDate(chartStart.getDate() + i);
    const key = localDay(d);
    return { date: key, count: perDayCount.get(key) ?? 0 };
  });

  res.json({
    counts: { activeSessions, openIncidents, alertsToday, endedWithoutChecklist },
    sessionsPerDay,
    recentAlerts: recent.map(alertToDto),
  });
});