import bcrypt from "bcrypt";
import { db, pool } from "../../config/db.js";
import { users } from "../schema/index.js";
import { env } from "../../config/env.js";
import { logger } from "../../utils/logger.js";
import { eq } from "drizzle-orm";

// Creates a single demo user so a fresh environment can be smoke-tested
// immediately without going through the register form first.
// Run with: npm run db:seed
const DEMO_USER = {
  fullName: "Demo Farmer",
  email: "demo@agricast.ai",
  password: "Demo@12345",
};

async function seed() {
  try {
    const existing = await db
      .select()
      .from(users)
      .where(eq(users.email, DEMO_USER.email));

    if (existing.length > 0) {
      logger.info("Seed skipped: demo user already exists", {
        email: DEMO_USER.email,
      });
      return;
    }

    const passwordHash = await bcrypt.hash(
      DEMO_USER.password,
      env.bcryptSaltRounds
    );

    await db.insert(users).values({
      fullName: DEMO_USER.fullName,
      email: DEMO_USER.email,
      passwordHash,
    });

    logger.info("Seed completed: demo user created", {
      email: DEMO_USER.email,
      password: DEMO_USER.password,
    });
  } catch (error) {
    logger.error("Seeding failed", { error: error.message });
    process.exitCode = 1;
  } finally {
    await pool.end();
  }
}

seed();
