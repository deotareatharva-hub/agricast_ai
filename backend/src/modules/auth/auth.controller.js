import { validationResult } from "express-validator";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { ApiError } from "../../utils/ApiError.js";
import { ApiResponse } from "../../utils/ApiResponse.js";
import { authService } from "./auth.service.js";

// Thin layer: validate input shape, call the service, shape the response.
// No business logic and no direct DB access should ever live here.

function assertValid(req) {
  const result = validationResult(req);
  if (!result.isEmpty()) {
    throw ApiError.badRequest("Validation failed", result.array());
  }
}

export const authController = {
  register: asyncHandler(async (req, res) => {
    assertValid(req);
    const { fullName, email, password } = req.body;
    const data = await authService.register({ fullName, email, password });
    return new ApiResponse(201, data, "Account created successfully").send(res);
  }),

  login: asyncHandler(async (req, res) => {
    assertValid(req);
    const { email, password } = req.body;
    const data = await authService.login({ email, password });
    return new ApiResponse(200, data, "Logged in successfully").send(res);
  }),

  me: asyncHandler(async (req, res) => {
    const data = await authService.getProfile(req.user.id);
    return new ApiResponse(200, data, "Profile fetched successfully").send(res);
  }),
};
