import { Router } from "express";
import { satelliteController } from "./satellite.controller.js";
import { imageQueryValidation, metadataQueryValidation } from "./satellite.validator.js";
import { requireAuth } from "../../middlewares/auth.middleware.js";

const router = Router();

// Every satellite route requires an authenticated user. requireAuth
// attaches req.user, and satellite.service.js scopes every lookup to
// req.user.id via farmRepository.findByIdForUser so a user can never
// request satellite data for a farm they don't own - same convention as
// modules/weather/weather.routes.js.
router.use(requireAuth);

// GET /api/v1/satellite/layers
router.get("/layers", satelliteController.getLayers);

// GET /api/v1/satellite/image/:farmId?layer=&startDate=&endDate=
router.get("/image/:farmId", imageQueryValidation, satelliteController.getImage);

// GET /api/v1/satellite/metadata/:farmId?layer=&startDate=&endDate=
router.get("/metadata/:farmId", metadataQueryValidation, satelliteController.getMetadata);

export default router;
