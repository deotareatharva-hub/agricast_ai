import { migrate } from "drizzle-orm/node-postgres/migrator";
import { db, pool } from "../config/db.js";
import { logger } from "../utils/logger.js";

// Applies every SQL file in src/db/migrations that hasn't run yet, in
// order. Run with: npm run db:migrate
async function runMigrations() {
  try {
    logger.info("Running database migrations...");
    await migrate(db, { migrationsFolder: "./src/db/migrations" });
    logger.info("Migrations completed successfully");
  } catch (error) {
    logger.error("Migration failed", { error: error.message });
    process.exitCode = 1;
  } finally {
    await pool.end();
  }
}

runMigrations();
