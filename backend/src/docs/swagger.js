import swaggerJsdoc from "swagger-jsdoc";
import { env } from "../config/env.js";

// Builds the OpenAPI spec from the @openapi JSDoc comments in each
// module's *.routes.js file (see modules/auth/auth.routes.js). Only the
// auth module has these comments today, per the scope of this upgrade -
// other modules can add their own @openapi blocks the same way later
// without touching this file.
export const openApiSpec = swaggerJsdoc({
  definition: {
    openapi: "3.0.3",
    info: {
      title: "AgriCast AI API",
      version: "1.0.0",
      description:
        "AgriCast AI backend API. This document currently covers the Authentication module (email/password, Google OAuth, refresh-token rotation).",
    },
    servers: [{ url: env.apiPrefix, description: "Current server" }],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
          description: "Short-lived access token returned by login/register/google/refresh.",
        },
      },
      schemas: {
        RegisterRequest: {
          type: "object",
          required: ["fullName", "email", "password"],
          properties: {
            fullName: { type: "string", example: "Asha Patil" },
            email: { type: "string", format: "email", example: "asha@example.com" },
            password: { type: "string", format: "password", example: "Password123" },
          },
        },
        LoginRequest: {
          type: "object",
          required: ["email", "password"],
          properties: {
            email: { type: "string", format: "email" },
            password: { type: "string", format: "password" },
          },
        },
        GoogleLoginRequest: {
          type: "object",
          required: ["credential"],
          properties: {
            credential: {
              type: "string",
              description: "The ID token (`credential`) returned by Google Identity Services on the frontend.",
            },
          },
        },
        UserDto: {
          type: "object",
          properties: {
            id: { type: "string", format: "uuid" },
            fullName: { type: "string" },
            email: { type: "string", format: "email" },
            avatarUrl: { type: "string", nullable: true },
            provider: { type: "string", enum: ["local", "google"] },
            role: { type: "string", enum: ["admin", "farmer"] },
            isVerified: { type: "boolean" },
            createdAt: { type: "string", format: "date-time" },
            updatedAt: { type: "string", format: "date-time" },
          },
        },
      },
    },
    security: [],
  },
  apis: ["./src/modules/auth/*.routes.js"],
});
