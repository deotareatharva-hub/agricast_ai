import { Router } from "express";
import { reportsController } from "./reports.controller.js";
import {
  generateReportValidation,
  listReportsValidation,
  idParamValidation,
} from "./reports.validator.js";
import { requireAuth } from "../../middlewares/auth.middleware.js";

const router = Router();

// Every reports route requires an authenticated user. requireAuth attaches
// req.user, and reports.service.js scopes every lookup to req.user.id via
// reportsRepository's generatedBy filter (and farmRepository.findByIdForUser
// for the farm itself) so a user can never generate, read, download, or
// delete a report they don't own - same convention as
// modules/ai/ai.routes.js and modules/weather/weather.routes.js.
router.use(requireAuth);

// POST /api/v1/reports/generate
router.post("/generate", generateReportValidation, reportsController.generate);

// GET /api/v1/reports?farmId=&reportType=&limit=&offset=
router.get("/", listReportsValidation, reportsController.list);

// GET /api/v1/reports/:id/download - must be registered before GET /:id so
// it isn't shadowed, though Express would still match it correctly either
// way since it's a distinct path.
router.get("/:id/download", idParamValidation, reportsController.download);

// GET /api/v1/reports/:id
router.get("/:id", idParamValidation, reportsController.getById);

// DELETE /api/v1/reports/:id
router.delete("/:id", idParamValidation, reportsController.delete);

export default router;
