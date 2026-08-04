import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { env } from "../config/env.js";

// Minimal, dependency-free structured logger. Morgan handles HTTP access
// logs separately (see middlewares/); this logger is for application-level
// events (startup, DB connection, errors) so log shape stays consistent
// whether it lands in the console or a file.

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const logsDir = path.resolve(__dirname, "../../logs");

if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

const logFilePath = path.join(logsDir, "app.log");

function write(level, message, meta) {
  const entry = {
    timestamp: new Date().toISOString(),
    level,
    message,
    ...(meta ? { meta } : {}),
  };

  const line = JSON.stringify(entry);

  // Always print to console (captured by process managers / docker logs).
  // eslint-disable-next-line no-console
  console[level === "error" ? "error" : "log"](line);

  // Also persist to a rotating-friendly flat file. In production this
  // would typically be replaced by shipping stdout to a log aggregator.
  if (env.isProduction) return; // production platforms usually capture stdout only
  fs.appendFile(logFilePath, line + "\n", () => {});
}

export const logger = {
  info: (message, meta) => write("info", message, meta),
  warn: (message, meta) => write("warn", message, meta),
  error: (message, meta) => write("error", message, meta),
};
