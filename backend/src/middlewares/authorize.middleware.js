import { ApiError } from "../utils/ApiError.js";

// Role-based authorization. Must run AFTER requireAuth (needs req.user).
// Usage: router.get("/admin-only", requireAuth, authorize("admin"), handler)
export const authorize = (...allowedRoles) => (req, res, next) => {
  if (!req.user) {
    throw ApiError.unauthorized("Authentication required");
  }
  if (!allowedRoles.includes(req.user.role)) {
    throw ApiError.forbidden("You do not have permission to perform this action");
  }
  next();
};
