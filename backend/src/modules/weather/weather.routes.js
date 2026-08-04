import { Router } from "express";
import { weatherController } from "./weather.controller.js";
import {
  farmIdParamValidation,
  historyQueryValidation,
} from "./weather.validation.js";
import { requireAuth } from "../../middlewares/auth.middleware.js";

const router = Router();

// Every weather route requires an authenticated user. requireAuth attaches
// req.user, and weather.service.js scopes every lookup to req.user.id via
// farmRepository.findByIdForUser so a user can never read weather for a
// farm they don't own - same convention as modules/farms/farm.routes.js.
router.use(requireAuth);

// GET /api/v1/weather/current/:farmId
router.get("/current/:farmId", farmIdParamValidation, weatherController.getCurrent);

// GET /api/v1/weather/hourly/:farmId
router.get("/hourly/:farmId", farmIdParamValidation, weatherController.getHourly);

// GET /api/v1/weather/daily/:farmId
router.get("/daily/:farmId", farmIdParamValidation, weatherController.getDaily);

// GET /api/v1/weather/history/:farmId?startDate=&endDate=
router.get("/history/:farmId", historyQueryValidation, weatherController.getHistory);

export default router;
