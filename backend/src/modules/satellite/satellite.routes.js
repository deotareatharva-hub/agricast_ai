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

// ---------------------------------------------------------------------------
// Discovery
// ---------------------------------------------------------------------------

// GET /api/v1/satellite/layers
// Returns the static list of supported imagery layers with labels/descriptions.
router.get("/layers", satelliteController.getLayers);

// ---------------------------------------------------------------------------
// Current / snapshot endpoints
// ---------------------------------------------------------------------------

// GET /api/v1/satellite/current/:farmId?layer=&startDate=&endDate=
// Fetches the most recent satellite snapshot (TRUE_COLOR by default) plus
// computed health metrics and scene metadata in a single response.
router.get("/current/:farmId", imageQueryValidation, satelliteController.getCurrent);

// GET /api/v1/satellite/ndvi/:farmId?startDate=&endDate=
// Fetches the NDVI layer image. Shorthand for /image/:farmId?layer=NDVI.
router.get("/ndvi/:farmId", metadataQueryValidation, satelliteController.getNdvi);

// GET /api/v1/satellite/health/:farmId?startDate=&endDate=
// Returns computed vegetation health score, crop assessment, and
// index classifications without returning a full image payload.
router.get("/health/:farmId", metadataQueryValidation, satelliteController.getHealth);

// ---------------------------------------------------------------------------
// Historical / timeline endpoints
// ---------------------------------------------------------------------------

// GET /api/v1/satellite/history/:farmId?startDate=&endDate=
// Returns scene metadata list (capture dates, cloud cover) for a date range.
router.get("/history/:farmId", metadataQueryValidation, satelliteController.getHistory);

// GET /api/v1/satellite/timelapse/:farmId?layer=
// Returns multiple image frames (last week, last month, last season) suitable
// for building a before/after comparison or animation on the frontend.
router.get("/timelapse/:farmId", imageQueryValidation, satelliteController.getTimelapse);

// ---------------------------------------------------------------------------
// Legacy / low-level endpoints (kept for backward compatibility)
// ---------------------------------------------------------------------------

// GET /api/v1/satellite/image/:farmId?layer=&startDate=&endDate=
router.get("/image/:farmId", imageQueryValidation, satelliteController.getImage);

// GET /api/v1/satellite/metadata/:farmId?layer=&startDate=&endDate=
router.get("/metadata/:farmId", metadataQueryValidation, satelliteController.getMetadata);

// ---------------------------------------------------------------------------
// Mutation endpoints
// ---------------------------------------------------------------------------

// POST /api/v1/satellite/refresh/:farmId
// Clears the satellite cache for the given farm and triggers a fresh fetch.
router.post("/refresh/:farmId", satelliteController.refreshCache);

export default router;
