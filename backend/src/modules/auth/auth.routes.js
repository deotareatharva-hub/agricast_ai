import { Router } from "express";
import { authController } from "./auth.controller.js";
import { registerValidation, loginValidation } from "./auth.validation.js";
import { requireAuth } from "../../middlewares/auth.middleware.js";

const router = Router();

// POST /api/v1/auth/register
router.post("/register", registerValidation, authController.register);

// POST /api/v1/auth/login
router.post("/login", loginValidation, authController.login);

// GET /api/v1/auth/me  (protected - example of requireAuth middleware use)
router.get("/me", requireAuth, authController.me);

export default router;
