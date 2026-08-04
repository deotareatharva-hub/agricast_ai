import pg from "pg";
import { drizzle } from "drizzle-orm/node-postgres";
import { env } from "./env.js";
import { logger } from "../utils/logger.js";
import * as schema from "../db/schema/index.js";

const { Pool } = pg;

// One shared connection pool for the whole app. Drizzle wraps it to give
// us a typed, schema-aware query builder everywhere else in the codebase.
export const pool = new Pool({
  connectionString: env.databaseUrl,
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
});

pool.on("error", (err) => {
  logger.error("Unexpected PostgreSQL pool error", { error: err.message });
});

export const db = drizzle(pool, { schema });

// Verifies the database is reachable. Called once at startup so the server
// fails fast with a clear message instead of surfacing confusing errors on
// the first incoming request.
export async function testConnection() {
  const client = await pool.connect();
  try {
    const result = await client.query("SELECT NOW() as now");
    logger.info("PostgreSQL connection established", {
      serverTime: result.rows[0].now,
    });
  } finally {
    client.release();
  }
}
