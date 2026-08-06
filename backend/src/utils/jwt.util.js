import jwt from "jsonwebtoken";
import crypto from "crypto";
import { env } from "../config/env.js";

// Thin wrapper around jsonwebtoken so token creation/verification logic
// (and the secret/expiry it depends on) lives in exactly one place.
//
// `sign`/`verify` are kept exactly as they were (existing email/password
// login still calls these). `signAccessToken`/`signRefreshToken` are new,
// additive helpers used by the Google OAuth + refresh-token-rotation flow.
export const jwtUtil = {
  sign: (payload) =>
    jwt.sign(payload, env.jwtSecret, { expiresIn: env.jwtExpiresIn }),

  verify: (token) => jwt.verify(token, env.jwtSecret),

  // Short-lived access token (15m default). Carries the same { sub, email }
  // shape the rest of the app already expects on req.user.
  signAccessToken: (payload) =>
    jwt.sign({ ...payload, type: "access" }, env.jwtAccessSecret, {
      expiresIn: env.jwtAccessExpiresIn,
    }),

  verifyAccessToken: (token) => jwt.verify(token, env.jwtAccessSecret),

  // Long-lived refresh token (30d default). Signed with a separate secret
  // so an access-token leak can't be replayed as a refresh token or vice
  // versa. jti ties the JWT to its refresh_tokens row for revocation.
  signRefreshToken: (payload, jti) =>
    jwt.sign({ ...payload, type: "refresh", jti }, env.jwtRefreshSecret, {
      expiresIn: env.jwtRefreshExpiresIn,
    }),

  verifyRefreshToken: (token) => jwt.verify(token, env.jwtRefreshSecret),

  // Refresh tokens are stored hashed (SHA-256) so a stolen DB dump can't
  // be replayed directly as a session cookie.
  hashToken: (token) => crypto.createHash("sha256").update(token).digest("hex"),
};
