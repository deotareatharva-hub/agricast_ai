# Security Guide (Authentication)

This covers the security posture of the auth upgrade specifically. General
app security (Helmet, CORS, input validation) predates this upgrade and is
kept as-is; only additions/changes are documented here.

## Transport & headers

- **Helmet** - already enabled app-wide (`app.js`), unchanged.
- **CORS** - already restricted to `CORS_ORIGIN` with `credentials: true`
  (required so the browser will send/receive the refresh cookie
  cross-origin). Unchanged, but now load-bearing for auth since the
  refresh cookie depends on it.

## Cookies

- Refresh token only, HttpOnly, `Secure` in production, scoped to
  `${API_PREFIX}/auth`. Full rationale in
  [`RefreshTokenGuide.md`](./RefreshTokenGuide.md#cookie-configuration).
- Access tokens are **never** cookied - they live in memory on the
  frontend and are sent explicitly via the `Authorization` header, which
  is immune to CSRF by construction (a third-party page can't set a custom
  header on a cross-site form submission).

## CSRF posture

The prompt's success criteria include "CSRF Protection (if cookies are
used)". Here's the actual exposure and why a dedicated CSRF token wasn't
added on top of the mitigations already in place:

- The **only** cookie is the refresh token, and it's scoped to `sameSite:
  "lax"` (dev) / `"none"` (prod, required for the cross-domain Vercel/Render
  split - see below) with `secure: true` in production.
- `POST /auth/refresh` and `POST /auth/logout` are the only endpoints that
  read this cookie. Both are **idempotent from an attacker's perspective**:
  the worst a forged cross-site request can do is rotate the victim's own
  refresh token or log the victim out - it cannot read the response (CORS
  blocks that for any origin other than `CORS_ORIGIN`) and cannot access
  the victim's data.
- Every endpoint that actually exposes or mutates user data
  (`/auth/me`, and all other modules) requires the `Authorization: Bearer`
  header, which a cross-site form/image/fetch-without-JS forgery cannot
  attach - this is the standard "Bearer tokens are CSRF-immune" argument.
- **Because `sameSite: "none"` is required in production** (frontend and
  backend are on different domains), the `lax`/`strict` CSRF mitigation
  that would normally apply doesn't fully hold there. If you need
  defense-in-depth beyond the "attacker can't read the response" argument
  above, add a double-submit CSRF token on `/auth/refresh` and
  `/auth/logout` specifically (they're the only cookie-reading routes) -
  this was left out of this upgrade to keep the change additive and
  because a proper answer needs QA against your actual deployment.

## Rate limiting

`backend/src/middlewares/rateLimit.middleware.js` adds `authRateLimiter`
(30 requests / 15 minutes / IP) to `/auth/register`, `/auth/login`,
`/auth/google`, and `/auth/refresh`. `/auth/logout` and `/auth/me` are not
rate-limited (logout is safe to spam; `/auth/me` is already gated by
`requireAuth`).

## Password & token secrets

- Bcrypt cost factor unchanged (`BCRYPT_SALT_ROUNDS`, default 12).
- `JWT_SECRET` (access tokens) and `JWT_REFRESH_SECRET` (refresh tokens)
  **must be different, long, random strings** - `.env.example` calls this
  out. Using the same secret for both would mean an access-token
  verification bypass also compromises refresh tokens.
- Refresh tokens are stored as SHA-256 hashes, not raw
  (see [`RefreshTokenGuide.md`](./RefreshTokenGuide.md#storage-hashed-not-raw)).

## Google credential trust boundary

Only `backend/src/integrations/auth/googleVerifier.js` is allowed to
extract identity claims from a Google credential, and only after
`google-auth-library`'s `verifyIdToken()` (which checks signature, issuer,
audience, and expiry) succeeds. `email_verified` is additionally checked.
No email/name/picture value the client sends directly in a request body is
ever trusted for identity purposes.

## Input validation

`express-validator` chains, unchanged in spirit: `registerValidation` /
`loginValidation` untouched, new `googleLoginValidation` requires
`credential` to be a non-empty string (the actual trust decision happens
server-side during verification, not from this shape check).

## Things intentionally out of scope for this upgrade

- Account lockout after N failed password attempts (rate limiting covers
  the brute-force case at the network level for now).
- Email verification flow for local (password) accounts (`isVerified`
  defaults to `false` for them and is unused elsewhere in this upgrade;
  Google accounts get `isVerified = true` immediately since Google already
  verified the email).
- "Log out everywhere" / session management UI.
- CSRF token on the two cookie-reading endpoints (see above).
