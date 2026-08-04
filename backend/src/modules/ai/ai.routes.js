import { Router } from "express";
import { aiController } from "./ai.controller.js";
import {
  recommendValidation,
  historyQueryValidation,
  farmIdParamValidation,
} from "./ai.validator.js";
import { requireAuth } from "../../middlewares/auth.middleware.js";

const router = Router();

// Every AI route requires an authenticated user. requireAuth attaches
// req.user, and ai.service.js scopes every lookup to req.user.id via
// farmRepository.findByIdForUser so a user can never generate or read
// recommendations for a farm they don't own - same convention as
// modules/weather/weather.routes.js and modules/satellite/satellite.routes.js.
router.use(requireAuth);

// POST /api/v1/ai/recommend
router.post("/recommend", recommendValidation, aiController.recommend);

// GET /api/v1/ai/history/:farmId?limit=&offset=
router.get("/history/:farmId", historyQueryValidation, aiController.getHistory);

// GET /api/v1/ai/latest/:farmId
router.get("/latest/:farmId", farmIdParamValidation, aiController.getLatest);

export default router;
