import { jwtUtil } from "../utils/jwt.util.js";
import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";

// Protects any route it's attached to: requires a valid `Authorization:
// Bearer <token>` header, verifies it, and attaches the decoded payload
// to req.user for downstream handlers.
export const requireAuth = asyncHandler(async (req, res, next) => {
  const header = req.headers.authorization;

  if (!header || !header.startsWith("Bearer ")) {
    throw ApiError.unauthorized("Authentication token missing");
  }

  const token = header.split(" ")[1];

  try {
    const payload = jwtUtil.verify(token);
    req.user = { id: payload.sub, email: payload.email };
    next();
  } catch {
    throw ApiError.unauthorized("Invalid or expired token");
  }
});
