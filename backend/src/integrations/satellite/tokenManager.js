import axios from "axios";
import { env } from "../../config/env.js";
import { logger } from "../../utils/logger.js";
import { ApiError } from "../../utils/ApiError.js";

// In-memory OAuth token cache for Sentinel Hub's client-credentials flow.
// Sentinel Hub tokens are scoped to the registered OAuth client (not to
// individual users), so ONE token is shared process-wide, refreshed
// automatically a safety margin before it actually expires, and never
// logged or returned to any caller outside this file - satellite.service.js
// only ever asks tokenManager.getToken() for a string, it never sees the
// client secret or the raw OAuth response.

const REFRESH_SAFETY_MARGIN_MS = 60 * 1000; // refresh 60s before actual expiry

let cachedToken = null; // { accessToken, expiresAt }
let inFlightRequest = null; // dedupes concurrent refreshes into one call

function isConfigured() {
  return Boolean(
    env.satellite.sentinel.clientId && env.satellite.sentinel.clientSecret
  );
}

function isFresh(token) {
  return (
    Boolean(token) &&
    token.expiresAt.getTime() - REFRESH_SAFETY_MARGIN_MS > Date.now()
  );
}

async function requestNewToken() {
  const body = new URLSearchParams({
    grant_type: "client_credentials",
    client_id: env.satellite.sentinel.clientId,
    client_secret: env.satellite.sentinel.clientSecret,
  });

  const response = await axios.post(env.satellite.sentinel.oauthUrl, body.toString(), {
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    timeout: env.satellite.sentinel.timeoutMs,
  });

  const { access_token: accessToken, expires_in: expiresIn } = response.data;
  if (!accessToken) {
    throw new Error("Sentinel Hub OAuth response did not include an access_token");
  }

  return {
    accessToken,
    expiresAt: new Date(Date.now() + Number(expiresIn || 3600) * 1000),
  };
}

export const tokenManager = {
  // Returns a valid access token string, refreshing (or waiting on an
  // in-flight refresh) as needed. Throws ApiError.internal if Sentinel Hub
  // credentials aren't configured or the OAuth call itself fails - callers
  // (integrations/satellite/sentinel.js) let this propagate as-is.
  getToken: async () => {
    if (!isConfigured()) {
      throw ApiError.internal("Satellite imagery is not configured on this server.");
    }

    if (isFresh(cachedToken)) {
      return cachedToken.accessToken;
    }

    if (!inFlightRequest) {
      inFlightRequest = requestNewToken()
        .then((token) => {
          cachedToken = token;
          return token.accessToken;
        })
        .catch((error) => {
          logger.error("Sentinel Hub OAuth token request failed", {
            message: error.message,
          });
          throw ApiError.internal(
            "Unable to authenticate with the satellite imagery provider."
          );
        })
        .finally(() => {
          inFlightRequest = null;
        });
    }

    return inFlightRequest;
  },

  // Drops the cached token so the next getToken() call forces a refresh.
  // Used by sentinel.js when Sentinel Hub itself rejects a token (401),
  // in case it was revoked or expired early server-side.
  invalidate: () => {
    cachedToken = null;
  },
};
