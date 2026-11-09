import { Router } from "express";
import argon2 from "argon2";
import { z } from "zod";
import { prisma } from "../db";
import { writeAudit } from "../audit";
import { requireRole } from "../middleware/auth";
import { isUniqueViolation } from "../prismaErrors";

export const attendantsRouter = Router();
attendantsRouter.use(requireRole("ADMIN"));

const createSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(100, "Name is too long"),
  email: z.string().trim().toLowerCase().max(255).email("Enter a valid email"),
  password: z
    .string()
    .min(12, "Password must be at least 12 characters")
    .max(128, "Password is too long"),
});

attendantsRouter.get("/", async (_req, res) => {
  const attendants = await prisma.user.findMany({
    where: { role: "ATTENDANT" },
    orderBy: { createdAt: "desc" },
    select: { id: true, name: true, email: true, createdAt: true },
  });
  res.json({ attendants });
});

attendantsRouter.post("/", async (req, res) => {
  const parsed = createSchema.safeParse(req.body);
  if (!parsed.success) {
    return res
      .status(400)
      .json({ error: "Check the form", fields: parsed.error.flatten().fieldErrors });
  }
  const { name, email, password } = parsed.data;
  const passwordHash = await argon2.hash(password);

  try {
    const attendant = await prisma.$transaction(async (tx) => {
      const u = await tx.user.create({
        data: { name, email, passwordHash, role: "ATTENDANT" },
        select: { id: true, name: true, email: true, createdAt: true },
      });
      await writeAudit(tx, {
        actorId: req.user!.id,
        action: "attendant added",
        target: u.email,
        ip: req.ip ?? null,
      });
      return u;
    });
    res.status(201).json({ attendant });
  } catch (e) {
    if (isUniqueViolation(e)) {
      return res.status(409).json({
        error: "An account with this email already exists",
        fields: { email: ["Already in use"] },
      });
    }
    throw e;
  }
});