import { config } from "dotenv";

config({ path: ".env.test", override: true });

const url = process.env.DATABASE_URL ?? "";
if (!/\/cafeguard_test(\?|$)/.test(url)) {
  throw new Error(
    "Tests must run against the cafeguard_test database. Check server/.env.test."
  );
}