import { Router } from "express";
import argon2 from "argon2";
import { z } from "zod";
import { prisma } from "../db";
import { config } from "../config";
import { writeAudit } from "../audit";
import { hashToken, newToken } from "../auth/tokens";
import { loginLimiter } from "../middleware/limits";
import { requireAuth, SESSION_COOKIE } from "../middleware/auth";

const SESSION_HOURS = 8;
const MAX_FAILED = 5;
const LOCK_MINUTES = 15;

const BAD_LOGIN = {
  error: "Invalid email or password, or the account is temporarily locked.",
};

const loginSchema = z.object({
  email: z.string().trim().toLowerCase().max(255).email(),
  password: z.string().min(1).max(128),
});

let dummyHash: Promise<string> | null = null;
function getDummyHash() {
  dummyHash ??= argon2.hash("not-a-real-password");
  return dummyHash;
}

async function recordFailure(userId: string, ip: string | null) {
  await prisma.$transaction(async (tx) => {
    const u = await tx.user.update({
      where: { id: userId },
      data: { failedAttempts: { increment: 1 } },
    });
    await writeAudit(tx, { actorId: userId, action: "sign-in failed", ip });
    if (u.failedAttempts >= MAX_FAILED) {
      await tx.user.update({
        where: { id: userId },
        data: {
          failedAttempts: 0,
          lockedUntil: new Date(Date.now() + LOCK_MINUTES * 60 * 1000),
        },
      });
      await writeAudit(tx, {
        actorId: userId,
        action: "account locked",
        detail: `Locked for ${LOCK_MINUTES} minutes after ${MAX_FAILED} failed sign-ins`,
        ip,
      });
    }
  });
}

export const authRouter = Router();

authRouter.post("/login", loginLimiter, async (req, res) => {
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "Enter a valid email and password." });
  }
  const { email, password } = parsed.data;
  const ip = req.ip ?? null;
  const now = new Date();

  const user = await prisma.user.findUnique({ where: { email } });
  const locked = !!user?.lockedUntil && user.lockedUntil > now;
  const removed = !!user?.deactivatedAt;

  // Always run a password check so timing doesn't reveal whether the email exists.
  const hash = user ? user.passwordHash : await getDummyHash();
  const passwordOk = await argon2.verify(hash, password);

  // A removed account using its correct password is worth recording.
  if (user && removed && passwordOk) {
    await prisma.$transaction((tx) =>
      writeAudit(tx, {
        actorId: user.id,
        action: "sign-in blocked",
        detail: "A removed account tried to sign in",
        ip,
      })
    );
  }

  if (!user || locked || removed || !passwordOk) {
    if (user && !locked && !removed) await recordFailure(user.id, ip);
    return res.status(401).json(BAD_LOGIN);
  }

  const token = newToken();
  const expiresAt = new Date(Date.now() + SESSION_HOURS * 60 * 60 * 1000);

  await prisma.$transaction(async (tx) => {
    await tx.user.update({
      where: { id: user.id },
      data: { failedAttempts: 0, lockedUntil: null },
    });
    await tx.authSession.deleteMany({ where: { expiresAt: { lt: now } } });
    await tx.authSession.create({
      data: { tokenHash: hashToken(token), userId: user.id, expiresAt },
    });
    await writeAudit(tx, { actorId: user.id, action: "sign-in", ip });
  });

  res.cookie(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "strict",
    secure: config.NODE_ENV === "production",
    maxAge: SESSION_HOURS * 60 * 60 * 1000,
    path: "/",
  });

  res.json({
    token,
    expiresAt,
    user: { id: user.id, name: user.name, email: user.email, role: user.role },
  });
});

authRouter.post("/logout", requireAuth, async (req, res) => {
  await prisma.$transaction(async (tx) => {
    await tx.authSession.deleteMany({ where: { id: req.sessionId } });
    await writeAudit(tx, { actorId: req.user!.id, action: "sign-out", ip: req.ip ?? null });
  });
  res.clearCookie(SESSION_COOKIE, { path: "/" });
  res.json({ ok: true });
});

authRouter.get("/me", requireAuth, (req, res) => {
  res.json({ user: req.user });
});