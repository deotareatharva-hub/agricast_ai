import { env } from "../config/env.js";
import { logger } from "../utils/logger.js";
import { ApiError } from "../utils/ApiError.js";

// Centralized error handler. Every thrown error (from asyncHandler,
// express-validator, or Express itself) ends up here. Keeps error response
// shape consistent and keeps stack traces out of production responses.
// eslint-disable-next-line no-unused-vars
export function errorMiddleware(err, req, res, next) {
  const isApiError = err instanceof ApiError;
  const statusCode = isApiError ? err.statusCode : 500;
  const message = isApiError ? err.message : "Internal server error";

  logger.error(err.message, {
    path: req.originalUrl,
    method: req.method,
    statusCode,
    stack: env.isProduction ? undefined : err.stack,
  });

  res.status(statusCode).json({
    success: false,
    message,
    ...(isApiError && err.details ? { errors: err.details } : {}),
    ...(env.isProduction ? {} : { stack: err.stack }),
  });
}
