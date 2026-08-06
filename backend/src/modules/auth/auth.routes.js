import { Router } from "express";
import { authController } from "./auth.controller.js";
import { registerValidation, loginValidation, googleLoginValidation } from "./auth.validation.js";
import { requireAuth } from "../../middlewares/auth.middleware.js";
import { authRateLimiter } from "../../middlewares/rateLimit.middleware.js";

const router = Router();

/**
 * @openapi
 * /auth/register:
 *   post:
 *     tags: [Auth]
 *     summary: Register a new account with email + password
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema: { $ref: '#/components/schemas/RegisterRequest' }
 *     responses:
 *       201: { description: Account created, sets refreshToken HttpOnly cookie }
 *       409: { description: Email already in use }
 */
router.post("/register", authRateLimiter, registerValidation, authController.register);

/**
 * @openapi
 * /auth/login:
 *   post:
 *     tags: [Auth]
 *     summary: Log in with email + password
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema: { $ref: '#/components/schemas/LoginRequest' }
 *     responses:
 *       200: { description: Logged in, sets refreshToken HttpOnly cookie }
 *       401: { description: Invalid credentials }
 */
router.post("/login", authRateLimiter, loginValidation, authController.login);

/**
 * @openapi
 * /auth/google:
 *   post:
 *     tags: [Auth]
 *     summary: Log in or register via Google Identity Services
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema: { $ref: '#/components/schemas/GoogleLoginRequest' }
 *     responses:
 *       200: { description: Logged in, sets refreshToken HttpOnly cookie }
 *       401: { description: Invalid Google credential }
 */
router.post("/google", authRateLimiter, googleLoginValidation, authController.google);

/**
 * @openapi
 * /auth/refresh:
 *   post:
 *     tags: [Auth]
 *     summary: Exchange the refreshToken cookie for a new access token (rotates the refresh token)
 *     responses:
 *       200: { description: New access token issued, refreshToken cookie rotated }
 *       401: { description: Refresh token missing, invalid, expired, or reused }
 */
router.post("/refresh", authRateLimiter, authController.refresh);

/**
 * @openapi
 * /auth/logout:
 *   post:
 *     tags: [Auth]
 *     summary: Revoke the current refresh token and clear the session cookie
 *     responses:
 *       200: { description: Logged out }
 */
router.post("/logout", authController.logout);

/**
 * @openapi
 * /auth/me:
 *   get:
 *     tags: [Auth]
 *     summary: Get the currently authenticated user
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200: { description: Current user profile }
 *       401: { description: Missing/invalid/expired access token }
 */
router.get("/me", requireAuth, authController.me);

export default router;
