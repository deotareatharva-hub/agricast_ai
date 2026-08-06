import { validationResult } from "express-validator";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { ApiError } from "../../utils/ApiError.js";
import { ApiResponse } from "../../utils/ApiResponse.js";
import { authService } from "./auth.service.js";
import { authCookies } from "./auth.cookies.js";

// Thin layer: validate input shape, call the service, shape the response.
// No business logic and no direct DB access should ever live here.

function assertValid(req) {
  const result = validationResult(req);
  if (!result.isEmpty()) {
    throw ApiError.badRequest("Validation failed", result.array());
  }
}

function requestMeta(req) {
  return { userAgent: req.headers["user-agent"] || null, ipAddress: req.ip };
}

// Shared by every flow that issues a fresh session: sets the refresh-token
// cookie and returns only the safe, JSON-serializable fields.
function respondWithSession(res, statusCode, message, result) {
  authCookies.set(res, result.refreshToken);
  const { refreshToken, ...body } = result;
  return new ApiResponse(statusCode, body, message).send(res);
}

export const authController = {
  register: asyncHandler(async (req, res) => {
    assertValid(req);
    const { fullName, email, password } = req.body;
    const data = await authService.register({ fullName, email, password }, requestMeta(req));
    return respondWithSession(res, 201, "Account created successfully", data);
  }),

  login: asyncHandler(async (req, res) => {
    assertValid(req);
    const { email, password } = req.body;
    const data = await authService.login({ email, password }, requestMeta(req));
    return respondWithSession(res, 200, "Logged in successfully", data);
  }),

  // POST /api/v1/auth/google - body: { credential: "<Google ID token>" }
  google: asyncHandler(async (req, res) => {
    assertValid(req);
    const { credential } = req.body;
    const data = await authService.googleLogin(credential, requestMeta(req));
    return respondWithSession(res, 200, "Logged in with Google successfully", data);
  }),

  // POST /api/v1/auth/refresh - reads the HttpOnly refresh cookie, rotates it.
  refresh: asyncHandler(async (req, res) => {
    const refreshToken = authCookies.read(req);
    const data = await authService.refresh(refreshToken, requestMeta(req));
    return respondWithSession(res, 200, "Session refreshed successfully", data);
  }),

  // POST /api/v1/auth/logout - revokes the refresh token and clears the cookie.
  logout: asyncHandler(async (req, res) => {
    const refreshToken = authCookies.read(req);
    await authService.logout(refreshToken);
    authCookies.clear(res);
    return new ApiResponse(200, null, "Logged out successfully").send(res);
  }),

  me: asyncHandler(async (req, res) => {
    const data = await authService.getProfile(req.user.id);
    return new ApiResponse(200, data, "Profile fetched successfully").send(res);
  }),
};
