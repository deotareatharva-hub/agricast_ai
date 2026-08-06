import { OAuth2Client } from "google-auth-library";
import { env } from "../../config/env.js";
import { ApiError } from "../../utils/ApiError.js";

// Verifies a Google ID token (the `credential` returned by Google Identity
// Services on the frontend) and returns the trusted claims from it. This
// is the ONLY place that should ever trust a Google credential - never
// trust user/email fields sent directly in the request body.
const client = env.google.clientId ? new OAuth2Client(env.google.clientId) : null;

export const googleVerifier = {
  verifyIdToken: async (idToken) => {
    if (!client) {
      throw ApiError.internal(
        "Google sign-in is not configured on this server (missing GOOGLE_CLIENT_ID)"
      );
    }

    if (!idToken) {
      throw ApiError.badRequest("Google credential is required");
    }

    let ticket;
    try {
      ticket = await client.verifyIdToken({
        idToken,
        audience: env.google.clientId,
      });
    } catch {
      throw ApiError.unauthorized("Invalid or expired Google credential");
    }

    const payload = ticket.getPayload();
    if (!payload || !payload.email) {
      throw ApiError.unauthorized("Google credential did not include an email address");
    }

    if (!payload.email_verified) {
      throw ApiError.unauthorized("Google account email is not verified");
    }

    return {
      providerId: payload.sub,
      email: payload.email,
      fullName: payload.name || payload.email.split("@")[0],
      avatarUrl: payload.picture || null,
    };
  },
};
