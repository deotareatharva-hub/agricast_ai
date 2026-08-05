import { app } from "./app.js";
import { env } from "./config/env.js";
import { testConnection } from "./config/db.js";
import { logger } from "./utils/logger.js";

// Boot sequence: verify the database is reachable BEFORE accepting HTTP
// traffic. If the DB is down, fail fast with a clear log line instead of
// starting a server that will error on every request.
async function start() {
  try {
    await testConnection();

    // Loud, one-time boot warning (not a hard failure - the rest of the
    // app works fine without it) so a missing Sentinel Hub credential is
    // obvious in the logs immediately instead of only surfacing later as
    // silent empty satellite data.
    if (!env.satellite.sentinel.clientId || !env.satellite.sentinel.clientSecret) {
      logger.warn(
        "SENTINEL_CLIENT_ID / SENTINEL_CLIENT_SECRET are not set - the Satellite module will not be able to fetch imagery until both are configured in .env"
      );
    }

    const server = app.listen(env.port, () => {
      logger.info(`AgriCast AI API listening on port ${env.port}`, {
        environment: env.nodeEnv,
        apiPrefix: env.apiPrefix,
      });
    });

    const shutdown = (signal) => {
      logger.info(`${signal} received - shutting down gracefully`);
      server.close(() => process.exit(0));
    };

    process.on("SIGINT", () => shutdown("SIGINT"));
    process.on("SIGTERM", () => shutdown("SIGTERM"));
  } catch (error) {
    logger.error("Failed to start server", { error: error.message });
    process.exit(1);
  }
}

start();
