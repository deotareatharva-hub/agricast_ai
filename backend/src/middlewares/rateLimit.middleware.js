import rateLimit from "express-rate-limit";
import { ApiError } from "../utils/ApiError.js";

// Throttles brute-force attempts against auth endpoints (login, register,
// Google login, refresh) without affecting any other module's rate.
export const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 30, // 30 requests per IP per window across auth endpoints
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res, next) => {
    next(ApiError.tooManyRequests("Too many auth requests. Please try again later."));
  },
});
