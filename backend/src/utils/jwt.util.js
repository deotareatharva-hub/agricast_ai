import jwt from "jsonwebtoken";
import { env } from "../config/env.js";

// Thin wrapper around jsonwebtoken so token creation/verification logic
// (and the secret/expiry it depends on) lives in exactly one place.
export const jwtUtil = {
  sign: (payload) =>
    jwt.sign(payload, env.jwtSecret, { expiresIn: env.jwtExpiresIn }),

  verify: (token) => jwt.verify(token, env.jwtSecret),
};
