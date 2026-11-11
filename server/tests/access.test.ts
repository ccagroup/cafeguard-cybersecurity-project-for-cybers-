import request from "supertest";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { prisma } from "../src/db";
import { app, bearer, createUser, disconnect, login, resetDb, tokenFor } from "./helpers";

beforeAll(resetDb);
afterAll(disconnect);

describe("roles", () => {
  it("lets an attendant read stations but not manage attendants", async () => {
    const attendant = await createUser("ATTENDANT", "Role Attendant");
    const token = await tokenFor(attendant);

    const stations = await request(app).get("/api/stations").set(bearer(token));
    expect(stations.status).toBe(200);

    const list = await request(app).get("/api/attendants").set(bearer(token));
    expect(list.status).toBe(403);

    const create = await request(app)
      .post("/api/attendants")
      .set(bearer(token))
      .send({ name: "Sneaky", email: "sneaky@test.local", password: "long-enough-password-1" });
    expect(create.status).toBe(403);
  });

  it("lets an admin add an attendant, and rejects a short password", async () => {
    const admin = await createUser("ADMIN", "Role Admin");
    const token = await tokenFor(admin);

    const short = await request(app)
      .post("/api/attendants")
      .set(bearer(token))
      .send({ name: "Short Pass", email: "short@test.local", password: "abc" });
    expect(short.status).toBe(400);

    const ok = await request(app)
      .post("/api/attendants")
      .set(bearer(token))
      .send({ name: "New Hire", email: "newhire@test.local", password: "long-enough-password-1" });
    expect(ok.status).toBeGreaterThanOrEqual(200);
    expect(ok.status).toBeLessThan(300);

    const row = await prisma.user.findUniqueOrThrow({ where: { email: "newhire@test.local" } });
    expect(row.role).toBe("ATTENDANT");
    expect(row.passwordHash).not.toContain("long-enough-password-1");
  });
});

describe("removing an attendant", () => {
  it("kills their sessions and blocks the next sign-in, and restore brings them back", async () => {
    const admin = await createUser("ADMIN", "Boss");
    const adminToken = await tokenFor(admin);
    const judy = await createUser("ATTENDANT", "Judy Left");
    const judyToken = await tokenFor(judy);

    const before = await request(app).get("/api/stations").set(bearer(judyToken));
    expect(before.status).toBe(200);

    const removed = await request(app)
      .post(`/api/attendants/${judy.id}/remove`)
      .set(bearer(adminToken));
    expect(removed.status).toBe(200);

    const row = await prisma.user.findUniqueOrThrow({ where: { id: judy.id } });
    expect(row.deactivatedAt).not.toBeNull();
    expect(await prisma.authSession.count({ where: { userId: judy.id } })).toBe(0);

    const after = await request(app).get("/api/stations").set(bearer(judyToken));
    expect(after.status).toBe(401);

    const relogin = await login(judy.email);
    expect(relogin.status).not.toBe(200);

    const restored = await request(app)
      .post(`/api/attendants/${judy.id}/restore`)
      .set(bearer(adminToken));
    expect(restored.status).toBe(200);
    expect((await login(judy.email)).status).toBe(200);
  });
});

describe("audit trail", () => {
  it("records actions, and offers no way to edit or delete entries", async () => {
    const admin = await createUser("ADMIN", "Audit Admin");
    const token = await tokenFor(admin);
    const count = await prisma.auditLog.count();
    expect(count).toBeGreaterThan(0);

    const list = await request(app).get("/api/audit").set(bearer(token));
    expect(list.status).toBe(200);

    for (const [method, path] of [
      ["put", "/api/audit/1"],
      ["patch", "/api/audit/1"],
      ["delete", "/api/audit/1"],
      ["delete", "/api/audit"],
      ["post", "/api/audit"],
    ] as const) {
      const res = await request(app)[method](path).set(bearer(token));
      expect(res.status, `${method.toUpperCase()} ${path}`).toBeGreaterThanOrEqual(400);
      expect(res.status).toBeLessThan(500);
    }
    expect(await prisma.auditLog.count()).toBeGreaterThanOrEqual(count);
  });
});