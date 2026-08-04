import { Router } from "express";
import { analyticsController } from "./analytics.controller.js";
import {
  dashboardValidation,
  weatherAnalyticsValidation,
  recommendationAnalyticsValidation,
  monthlyValidation,
  weeklyValidation,
  summaryValidation,
} from "./analytics.validator.js";
import { requireAuth } from "../../middlewares/auth.middleware.js";

const router = Router();

// Every analytics route requires an authenticated user. requireAuth
// attaches req.user, and analytics.service.js scopes every lookup to
// req.user.id via farmRepository.findByIdForUser, so a user can never
// read analytics for a farm they don't own - same convention as
// modules/reports/reports.routes.js and modules/ai/ai.routes.js.
router.use(requireAuth);

// GET /api/v1/analytics/dashboard/:farmId
router.get("/dashboard/:farmId", dashboardValidation, analyticsController.dashboard);

// GET /api/v1/analytics/weather/:farmId
router.get("/weather/:farmId", weatherAnalyticsValidation, analyticsController.weather);

// GET /api/v1/analytics/recommendations/:farmId
router.get(
  "/recommendations/:farmId",
  recommendationAnalyticsValidation,
  analyticsController.recommendations
);

// GET /api/v1/analytics/monthly/:farmId
router.get("/monthly/:farmId", monthlyValidation, analyticsController.monthly);

// GET /api/v1/analytics/weekly/:farmId
router.get("/weekly/:farmId", weeklyValidation, analyticsController.weekly);

// GET /api/v1/analytics/summary/:farmId
router.get("/summary/:farmId", summaryValidation, analyticsController.summary);

export default router;
