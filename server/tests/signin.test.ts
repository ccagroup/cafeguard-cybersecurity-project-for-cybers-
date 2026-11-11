import request from "supertest";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { app, bearer, createUser, disconnect, login, resetDb, tokenFor } from "./helpers";

beforeAll(resetDb);
afterAll(disconnect);

const dataRoutes: [string, string][] = [
  ["get", "/api/auth/me"],
  ["post", "/api/auth/logout"],
  ["get", "/api/stations"],
  ["post", "/api/stations/x/sessions"],
  ["post", "/api/stations/x/report-activity"],
  ["post", "/api/stations/x/reopen-last"],
  ["post", "/api/sessions/x/end"],
  ["post", "/api/sessions/x/force-end"],
  ["get", "/api/alerts"],
  ["post", "/api/alerts/x/acknowledge"],
  ["get", "/api/incidents"],
  ["post", "/api/incidents"],
  ["get", "/api/incidents/x"],
  ["patch", "/api/incidents/x/status"],
  ["put", "/api/incidents/x/notes"],
  ["get", "/api/audit"],
  ["get", "/api/dashboard"],
  ["get", "/api/attendants"],
  ["post", "/api/attendants"],
  ["post", "/api/attendants/x/remove"],
  ["post", "/api/attendants/x/restore"],
];

describe("the sign-in gate", () => {
  it("keeps the health check public", async () => {
    const res = await request(app).get("/api/health");
    expect(res.status).toBe(200);
  });

  it("answers 401 on every data route when not signed in", async () => {
    for (const [method, path] of dataRoutes) {
      const res = await request(app)[method as "get"](path);
      expect(res.status, `${method.toUpperCase()} ${path}`).toBe(401);
    }
  });

  it("answers 401 on API paths that do not exist yet, so new routes are never open by accident", async () => {
    const res = await request(app).get("/api/some-future-route");
    expect(res.status).toBe(401);
  });

  it("rejects a made-up bearer token", async () => {
    const res = await request(app).get("/api/stations").set(bearer("not-a-real-token"));
    expect(res.status).toBe(401);
  });
});

describe("signing in", () => {
  it("returns a bearer token that works", async () => {
    const admin = await createUser("ADMIN", "Owner One");
    const res = await login(admin.email);
    expect(res.status).toBe(200);
    expect(typeof res.body.token).toBe("string");
    expect(res.body.user.role).toBe("ADMIN");
    expect(res.body.user.passwordHash).toBeUndefined();

    const me = await request(app).get("/api/auth/me").set(bearer(res.body.token));
    expect(me.status).toBe(200);
    expect(me.body.user.email).toBe(admin.email);
  });

  it("also works with the cookie when the bearer token is not sent", async () => {
    const admin = await createUser("ADMIN", "Owner Two");
    const res = await login(admin.email);
    const cookie = (res.headers["set-cookie"] as unknown as string[])[0];
    expect(cookie).toContain("HttpOnly");
    expect(cookie).toContain("SameSite=Strict");

    const me = await request(app).get("/api/auth/me").set("Cookie", cookie);
    expect(me.status).toBe(200);
  });

  it("blocks a cookie-based change that lacks the anti-forgery header", async () => {
    const admin = await createUser("ADMIN", "Owner Three");
    const res = await login(admin.email);
    const cookie = (res.headers["set-cookie"] as unknown as string[])[0];

    const blocked = await request(app).post("/api/auth/logout").set("Cookie", cookie);
    expect(blocked.status).toBe(403);

    const allowed = await request(app)
      .post("/api/auth/logout")
      .set("Cookie", cookie)
      .set("X-Requested-With", "cafeguard");
    expect(allowed.status).toBe(200);
  });

  it("stops working after sign-out", async () => {
    const admin = await createUser("ADMIN", "Owner Four");
    const token = await tokenFor(admin);
    await request(app).post("/api/auth/logout").set(bearer(token));
    const me = await request(app).get("/api/auth/me").set(bearer(token));
    expect(me.status).toBe(401);
  });

  it("gives the same message for a wrong password and an unknown email", async () => {
    const admin = await createUser("ADMIN", "Owner Five");
    const wrong = await login(admin.email, "wrong-password-123");
    const unknown = await login("nobody@test.local", "wrong-password-123");
    expect(wrong.status).toBe(401);
    expect(unknown.status).toBe(401);
    expect(wrong.body.error).toBe(unknown.body.error);
  });

  it("rejects an injection attempt in the email field before it reaches the database", async () => {
    const res = await login("x' OR 1=1 --", "whatever-123456");
    expect(res.status).toBe(400);
  });
});