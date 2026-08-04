import { ApiError } from "../utils/ApiError.js";

// Catches any request that didn't match a defined route and forwards a
// clean 404 ApiError into the error middleware instead of Express's
// default HTML error page.
export function notFoundMiddleware(req, res, next) {
  next(ApiError.notFound(`Route not found: ${req.method} ${req.originalUrl}`));
}
