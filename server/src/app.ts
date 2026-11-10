import express from "express";
import type { NextFunction, Request, Response } from "express";
import helmet from "helmet";
import cors from "cors";
import cookieParser from "cookie-parser";
import { config } from "./config";
import { apiLimiter } from "./middleware/limits";
import { requireAuth } from "./middleware/auth";
import { authRouter } from "./routes/auth";
import { attendantsRouter } from "./routes/attendants";
import { stationsRouter } from "./routes/stations";
import { sessionsRouter } from "./routes/sessions";
import { alertsRouter } from "./routes/alerts";
import { incidentsRouter } from "./routes/incidents";
import { auditRouter } from "./routes/audit";
import { dashboardRouter } from "./routes/dashboard";

export function createApp() {
  const app = express();

  app.disable("x-powered-by");
  app.use(helmet());
  app.use(cors({ origin: config.CLIENT_ORIGIN, credentials: true }));
  app.use(express.json({ limit: "10kb" }));
  app.use(cookieParser());

  app.get("/api/health", (_req, res) => {
    res.json({ status: "ok" });
  });

  app.use("/api", apiLimiter);
  app.use("/api/auth", authRouter);

  // Everything below this line requires sign-in.
  app.use("/api", requireAuth);
  app.use("/api/attendants", attendantsRouter);
  app.use("/api/stations", stationsRouter);
  app.use("/api/sessions", sessionsRouter);
  app.use("/api/alerts", alertsRouter);
  app.use("/api/incidents", incidentsRouter);
  app.use("/api/audit", auditRouter);
  app.use("/api/dashboard", dashboardRouter);

  app.use("/api", (_req, res) => {
    res.status(404).json({ error: "Not found" });
  });

  app.use((err: unknown, _req: Request, res: Response, _next: NextFunction) => {
    const status = (err as { status?: number })?.status;
    if (typeof status === "number" && status >= 400 && status < 500) {
      return res.status(status).json({ error: "Bad request" });
    }
    console.error(err);
    res.status(500).json({ error: "Something went wrong" });
  });

  return app;
}