import "dotenv/config";
import { defineConfig } from "drizzle-kit";

// Config for the drizzle-kit CLI (`npm run db:generate`, `db:studio`).
// Points at the schema barrel file and writes SQL migration files into
// src/db/migrations.
export default defineConfig({
  schema: "./src/db/schema/index.js",
  out: "./src/db/migrations",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL,
  },
  verbose: true,
  strict: true,
});
