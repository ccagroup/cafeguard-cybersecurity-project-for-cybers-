import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { prisma } from "../src/db";
import { createUser, disconnect, login, resetDb } from "./helpers";

beforeAll(resetDb);
afterAll(disconnect);

describe("account lockout", () => {
  it("locks the account after 5 wrong passwords, even for the correct password", async () => {
    const user = await createUser("ATTENDANT", "Lock Me");

    for (let i = 0; i < 5; i++) {
      const res = await login(user.email, "wrong-password-123");
      expect(res.status).toBe(401);
    }

    const row = await prisma.user.findUniqueOrThrow({ where: { id: user.id } });
    expect(row.lockedUntil).not.toBeNull();
    expect(row.lockedUntil!.getTime()).toBeGreaterThan(Date.now());

    const correct = await login(user.email);
    expect(correct.status).not.toBe(200);
    expect(correct.body.token).toBeUndefined();
  });

  it("does not lock an account that only failed twice", async () => {
    const user = await createUser("ATTENDANT", "Almost Locked");
    await login(user.email, "wrong-password-123");
    await login(user.email, "wrong-password-123");

    const ok = await login(user.email);
    expect(ok.status).toBe(200);
  });
});