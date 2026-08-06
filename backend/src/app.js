import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import cookieParser from "cookie-parser";
import swaggerUi from "swagger-ui-express";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

import { env } from "./config/env.js";
import routes from "./routes/index.js";
import { openApiSpec } from "./docs/swagger.js";
import { errorMiddleware } from "./middlewares/error.middleware.js";
import { notFoundMiddleware } from "./middlewares/notFound.middleware.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const logsDir = path.resolve(__dirname, "../logs");
if (!fs.existsSync(logsDir)) fs.mkdirSync(logsDir, { recursive: true });

export const app = express();

// --- Security & parsing middleware -----------------------------------------
app.use(helmet());
app.use(
  cors({
    origin: env.corsOrigin,
    credentials: true,
  })
);
app.use(express.json({ limit: "10kb" }));
app.use(express.urlencoded({ extended: true, limit: "10kb" }));
app.use(cookieParser());

// --- HTTP access logging -----------------------------------------------------
// Console output in every environment, plus a persisted access log file.
const accessLogStream = fs.createWriteStream(path.join(logsDir, "access.log"), {
  flags: "a",
});
app.use(morgan(env.isProduction ? "combined" : "dev"));
app.use(morgan("combined", { stream: accessLogStream }));

// --- API documentation (Swagger UI) --------------------------------------------
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(openApiSpec));

// --- Routes -------------------------------------------------------------------
app.use(env.apiPrefix, routes);

// --- 404 + centralized error handling -----------------------------------------
app.use(notFoundMiddleware);
app.use(errorMiddleware);
