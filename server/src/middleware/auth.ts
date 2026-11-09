import type { NextFunction, Request, Response } from "express";
import type { Role } from "@prisma/client";
import { prisma } from "../db";
import { hashToken } from "../auth/tokens";

export const SESSION_COOKIE = "cg_session";

export type AuthUser = { id: string; name: string; email: string; role: Role };

declare global {
  namespace Express {
    interface Request {
      user?: AuthUser;
      sessionId?: string;
    }
  }
}

const SAFE_METHODS = new Set(["GET", "HEAD", "OPTIONS"]);

function readToken(req: Request): { token: string; via: "bearer" | "cookie" } | null {
  const header = req.get("authorization");
  if (header && header.startsWith("Bearer ")) {
    const token = header.slice(7).trim();
    if (token) return { token, via: "bearer" };
  }
  const cookie = req.cookies?.[SESSION_COOKIE];
  if (typeof cookie === "string" && cookie) return { token: cookie, via: "cookie" };
  return null;
}

export async function requireAuth(req: Request, res: Response, next: NextFunction) {
  const found = readToken(req);
  if (!found) return res.status(401).json({ error: "Sign in required" });

  if (
    found.via === "cookie" &&
    !SAFE_METHODS.has(req.method) &&
    req.get("x-requested-with") !== "cafeguard"
  ) {
    return res.status(403).json({ error: "Request blocked" });
  }

  const session = await prisma.authSession.findUnique({
    where: { tokenHash: hashToken(found.token) },
    include: { user: true },
  });
  if (!session || session.expiresAt <= new Date()) {
    return res.status(401).json({ error: "Sign in required" });
  }

  req.user = {
    id: session.user.id,
    name: session.user.name,
    email: session.user.email,
    role: session.user.role,
  };
  req.sessionId = session.id;
  next();
}

export function requireRole(role: Role) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (req.user?.role !== role) return res.status(403).json({ error: "Not allowed" });
    next();
  };
}