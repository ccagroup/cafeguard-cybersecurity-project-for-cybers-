import argon2 from "argon2";
import request from "supertest";
import { createApp } from "../src/app";
import { prisma } from "../src/db";

export const app = createApp();
export const PASSWORD = "correct-horse-battery-1";

const passwordHash = argon2.hash(PASSWORD);

const TABLES = [
  "AuthSession",
  "AuditLog",
  "Alert",
  "Incident",
  "CustomerSession",
  "Station",
  "User",
];

export async function resetDb() {
  await prisma.$transaction([
    prisma.$executeRawUnsafe("SET FOREIGN_KEY_CHECKS = 0"),
    ...TABLES.map((t) => prisma.$executeRawUnsafe(`TRUNCATE TABLE \`${t}\``)),
    prisma.$executeRawUnsafe("SET FOREIGN_KEY_CHECKS = 1"),
  ]);
}

export async function disconnect() {
  await prisma.$disconnect();
}

export async function createUser(role: "ADMIN" | "ATTENDANT", name = "Test User") {
  const email = `${name.toLowerCase().replace(/\s+/g, ".")}@test.local`;
  return prisma.user.create({
    data: { name, email, role, passwordHash: await passwordHash },
  });
}

export function login(email: string, password = PASSWORD) {
  return request(app).post("/api/auth/login").send({ email, password });
}

export async function tokenFor(user: { email: string }): Promise<string> {
  const res = await login(user.email);
  return res.body.token as string;
}

export const bearer = (token: string) => ({ Authorization: `Bearer ${token}` });

export function createStation(label = "PC-01") {
  return prisma.station.create({ data: { label } });
}