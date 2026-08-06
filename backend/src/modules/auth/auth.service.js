import bcrypt from "bcrypt";
import crypto from "crypto";
import { env } from "../../config/env.js";
import { ApiError } from "../../utils/ApiError.js";
import { jwtUtil } from "../../utils/jwt.util.js";
import { authRepository } from "./auth.repository.js";
import { refreshTokenRepository } from "./refreshToken.repository.js";
import { googleVerifier } from "../../integrations/auth/googleVerifier.js";

// Business logic for authentication. Controllers call these functions and
// never touch bcrypt, JWT, the repository, or Google directly.

function sanitizeUser(user) {
  // Never send passwordHash (or the raw Google providerId) to the client.
  const { passwordHash, providerId, ...safeUser } = user;
  return safeUser;
}

function tokenPayload(user) {
  return { sub: user.id, email: user.email, role: user.role };
}

// Issues a fresh access token + refresh token pair for a user, persisting
// the refresh token (hashed) so it can be rotated/revoked later. This is
// the single place every login path (email, register, Google, refresh)
// goes through so the token contract never drifts between flows.
async function issueTokenPair(user, meta = {}) {
  const accessToken = jwtUtil.signAccessToken(tokenPayload(user));

  const refreshTokenId = crypto.randomUUID();
  const refreshToken = jwtUtil.signRefreshToken(tokenPayload(user), refreshTokenId);

  await refreshTokenRepository.create({
    id: refreshTokenId,
    userId: user.id,
    tokenHash: jwtUtil.hashToken(refreshToken),
    expiresAt: new Date(Date.now() + env.jwtRefreshExpiresMs),
    userAgent: meta.userAgent || null,
    ipAddress: meta.ipAddress || null,
  });

  return { accessToken, refreshToken };
}

export const authService = {
  register: async ({ fullName, email, password }, meta) => {
    const existing = await authRepository.findByEmail(email);
    if (existing) {
      throw ApiError.conflict("An account with this email already exists");
    }

    const passwordHash = await bcrypt.hash(password, env.bcryptSaltRounds);
    const user = await authRepository.create({ fullName, email, passwordHash });

    const { accessToken, refreshToken } = await issueTokenPair(user, meta);
    // `token` is kept for backward compatibility with the existing
    // frontend (which reads data.token as the bearer token). New callers
    // should prefer `accessToken`.
    return { user: sanitizeUser(user), token: accessToken, accessToken, refreshToken };
  },

  login: async ({ email, password }, meta) => {
    const user = await authRepository.findByEmail(email);
    if (!user || !user.passwordHash) {
      // Same generic message whether the account doesn't exist or is a
      // Google-only account with no password - avoids leaking which case
      // it is.
      throw ApiError.unauthorized("Invalid email or password");
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      throw ApiError.unauthorized("Invalid email or password");
    }

    const { accessToken, refreshToken } = await issueTokenPair(user, meta);
    return { user: sanitizeUser(user), token: accessToken, accessToken, refreshToken };
  },

  // Google Identity Services flow: verify the ID token server-side, then
  // find-or-create the user, mirroring the login/register response shape.
  googleLogin: async (idToken, meta) => {
    const claims = await googleVerifier.verifyIdToken(idToken);

    let user = await authRepository.findByProviderId("google", claims.providerId);

    if (!user) {
      const existingByEmail = await authRepository.findByEmail(claims.email);
      if (existingByEmail) {
        // A local account already owns this email - link the Google
        // identity to it instead of creating a duplicate account.
        user = await authRepository.linkGoogleIdentity(existingByEmail.id, claims);
      } else {
        user = await authRepository.createFromGoogle(claims);
      }
    }

    const { accessToken, refreshToken } = await issueTokenPair(user, meta);
    return { user: sanitizeUser(user), token: accessToken, accessToken, refreshToken };
  },

  // Verifies the presented refresh token, rotates it (issues a new pair,
  // revokes the old token), and detects reuse of an already-rotated
  // token - which indicates the token was stolen - by revoking the whole
  // family for that user.
  refresh: async (refreshToken, meta) => {
    if (!refreshToken) {
      throw ApiError.unauthorized("Refresh token missing");
    }

    let decoded;
    try {
      decoded = jwtUtil.verifyRefreshToken(refreshToken);
    } catch {
      throw ApiError.unauthorized("Invalid or expired refresh token");
    }

    const stored = await refreshTokenRepository.findByHash(jwtUtil.hashToken(refreshToken));
    if (!stored) {
      throw ApiError.unauthorized("Refresh token not recognized");
    }

    if (stored.revoked) {
      // Reuse of a rotated-out (or already-logged-out) token: treat as a
      // possible theft and kill every session for this user.
      await refreshTokenRepository.revokeAllForUser(stored.userId);
      throw ApiError.unauthorized("Refresh token has already been used. Please log in again.");
    }

    if (new Date(stored.expiresAt) < new Date()) {
      throw ApiError.unauthorized("Refresh token has expired. Please log in again.");
    }

    const user = await authRepository.findById(decoded.sub);
    if (!user) {
      throw ApiError.unauthorized("Account no longer exists");
    }

    const accessToken = jwtUtil.signAccessToken(tokenPayload(user));

    const newRefreshTokenId = crypto.randomUUID();
    const newRefreshToken = jwtUtil.signRefreshToken(tokenPayload(user), newRefreshTokenId);

    await refreshTokenRepository.create({
      id: newRefreshTokenId,
      userId: user.id,
      tokenHash: jwtUtil.hashToken(newRefreshToken),
      expiresAt: new Date(Date.now() + env.jwtRefreshExpiresMs),
      userAgent: meta?.userAgent || null,
      ipAddress: meta?.ipAddress || null,
    });
    await refreshTokenRepository.markRotated(stored.id, newRefreshTokenId);

    return { user: sanitizeUser(user), token: accessToken, accessToken, refreshToken: newRefreshToken };
  },

  logout: async (refreshToken) => {
    if (!refreshToken) return;
    const stored = await refreshTokenRepository.findByHash(jwtUtil.hashToken(refreshToken));
    if (stored && !stored.revoked) {
      await refreshTokenRepository.revoke(stored.id);
    }
  },

  getProfile: async (userId) => {
    const user = await authRepository.findById(userId);
    if (!user) {
      throw ApiError.notFound("User not found");
    }
    return { user: sanitizeUser(user) };
  },
};
