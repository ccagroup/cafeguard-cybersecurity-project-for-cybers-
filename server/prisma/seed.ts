import "dotenv/config";
import argon2 from "argon2";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const email = process.env.SEED_ADMIN_EMAIL?.trim().toLowerCase();
  const password = process.env.SEED_ADMIN_PASSWORD;
  const name = process.env.SEED_ADMIN_NAME?.trim() || "Owner";

  if (!email || !password || password.length < 12) {
    throw new Error(
      "Set SEED_ADMIN_EMAIL and SEED_ADMIN_PASSWORD (12+ characters) in .env"
    );
  }

  const existing = await prisma.user.findUnique({ where: { email } });
  if (!existing) {
    await prisma.user.create({
      data: {
        name,
        email,
        passwordHash: await argon2.hash(password),
        role: "ADMIN",
      },
    });
    console.log("Admin created:", email);
  } else {
    console.log("Admin already exists:", email);
  }

  for (let i = 1; i <= 8; i++) {
    const label = `PC-${String(i).padStart(2, "0")}`;
    await prisma.station.upsert({ where: { label }, update: {}, create: { label } });
  }
  console.log("Stations ready: PC-01 to PC-08");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());