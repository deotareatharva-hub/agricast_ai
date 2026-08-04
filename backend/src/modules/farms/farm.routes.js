import { Router } from "express";
import { farmController } from "./farm.controller.js";
import {
  createFarmValidation,
  updateFarmValidation,
  idParamValidation,
  listQueryValidation,
} from "./farm.validation.js";
import { requireAuth } from "../../middlewares/auth.middleware.js";

const router = Router();

// Every farm route requires an authenticated user. requireAuth attaches
// req.user, and every service/repository call downstream is scoped to
// req.user.id so a user can never view or modify another user's farms.
router.use(requireAuth);

// POST /api/v1/farms
router.post("/", createFarmValidation, farmController.create);

// GET /api/v1/farms
router.get("/", listQueryValidation, farmController.list);

// GET /api/v1/farms/:id
router.get("/:id", idParamValidation, farmController.getById);

// PUT /api/v1/farms/:id
router.put(
  "/:id",
  [...idParamValidation, ...updateFarmValidation],
  farmController.update
);

// DELETE /api/v1/farms/:id
router.delete("/:id", idParamValidation, farmController.remove);

export default router;
