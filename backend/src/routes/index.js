import { Router } from "express";
import { env } from "../config/env.js";
import authRoutes from "../modules/auth/auth.routes.js";
import farmRoutes from "../modules/farms/farm.routes.js";
import weatherRoutes from "../modules/weather/weather.routes.js";
import satelliteRoutes from "../modules/satellite/satellite.routes.js";
import aiRoutes from "../modules/ai/ai.routes.js";
import reportRoutes from "../modules/reports/reports.routes.js";
import analyticsRoutes from "../modules/analytics/analytics.routes.js";

const router = Router();

// Simple, unauthenticated liveness/readiness check. The frontend dashboard
// pings this in Phase 1 to prove the frontend <-> backend wire-up works.
router.get("/health", (req, res) => {
  res.status(200).json({
    success: true,
    message: "AgriCast AI API is running",
    environment: env.nodeEnv,
    timestamp: new Date().toISOString(),
  });
});

router.use("/auth", authRoutes);
router.use("/farms", farmRoutes);
router.use("/weather", weatherRoutes);
router.use("/satellite", satelliteRoutes);
router.use("/ai", aiRoutes);
router.use("/reports", reportRoutes);
router.use("/analytics", analyticsRoutes);

export default router;
