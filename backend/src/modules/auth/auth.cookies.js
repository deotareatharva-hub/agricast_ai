import { env } from "../../config/env.js";

// Refresh tokens are delivered via an HttpOnly cookie (never in the JSON
// body) so client-side JS/XSS can't read them. Access tokens stay in the
// JSON response body and are kept in memory on the frontend.
//
// sameSite: "none" is required for cross-site deployments (Vercel
// frontend + Render backend live on different domains) and requires
// secure: true. In local dev (http://localhost) we fall back to "lax" so
// the cookie still works without HTTPS.
const COOKIE_NAME = "refreshToken";

function cookieOptions() {
  return {
    httpOnly: true,
    secure: env.isProduction,
    sameSite: env.isProduction ? "none" : "lax",
    path: `${env.apiPrefix}/auth`, // only sent to auth endpoints that need it
    maxAge: env.jwtRefreshExpiresMs,
  };
}

export const authCookies = {
  name: COOKIE_NAME,

  set: (res, refreshToken) => {
    res.cookie(COOKIE_NAME, refreshToken, cookieOptions());
  },

  clear: (res) => {
    res.clearCookie(COOKIE_NAME, { ...cookieOptions(), maxAge: undefined });
  },

  read: (req) => req.cookies?.[COOKIE_NAME] || null,
};
