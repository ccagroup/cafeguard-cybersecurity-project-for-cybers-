import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { disconnect, login, resetDb } from "./helpers";

beforeAll(resetDb);
afterAll(disconnect);

describe("login rate limit", () => {
  it("starts refusing with 429 after about 10 failed attempts from one IP", async () => {
    const statuses: number[] = [];
    for (let i = 0; i < 14; i++) {
      const res = await login(`nobody${i}@test.local`, "wrong-password-123");
      statuses.push(res.status);
    }
    expect(statuses).toContain(429);
    expect(statuses.slice(0, 5).every((s) => s === 401)).toBe(true);
  });
});