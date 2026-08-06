# Refresh Token Guide

## Why two tokens

- **Access token** - 15 minutes, signed JWT, sent in `Authorization: Bearer
  <token>` on every API request, verified stateless (no DB lookup). Short
  life limits the damage if one leaks (e.g. via a browser extension or
  logged request).
- **Refresh token** - 30 days, signed JWT **plus** a corresponding row in
  the `refresh_tokens` table, delivered only via an HttpOnly cookie
  (JavaScript can never read it). Used solely to mint new access tokens at
  `POST /auth/refresh`.

Two separate secrets are used (`JWT_SECRET` for access tokens,
`JWT_REFRESH_SECRET` for refresh tokens), so a leaked access token can't be
replayed as a refresh token even if someone tried to reuse it against the
wrong verify function.

## Storage: hashed, not raw

`refresh_tokens.token_hash` stores `SHA-256(refresh_token)`, never the raw
JWT. If the database were ever dumped, the attacker still couldn't present
those hashes as valid cookies - they'd need the original signed JWT, which
only ever left the server in an HttpOnly cookie header.

## Rotation

Every time `POST /auth/refresh` is called successfully:

1. The presented refresh token is verified (signature + expiry) and looked
   up by hash in `refresh_tokens`.
2. A **new** access + refresh token pair is issued.
3. The **old** refresh token row is marked `revoked = true` and
   `replaced_by_token_id` is set to the new row's id.
4. The new refresh token is set as the cookie; the old one is now unusable.

This means a refresh token is single-use - each `/auth/refresh` call
consumes the current one and issues a new one, extending the session by
another 30 days from that point.

## Reuse detection (theft response)

If a refresh token that's already been rotated (`revoked = true`) is
presented again, that's a strong signal it was stolen (a copy was made
before/during a legitimate rotation, and both the attacker and the real
user are now racing to use it). In that case:

- The request is rejected with 401.
- **Every** refresh token for that user is revoked
  (`refreshTokenRepository.revokeAllForUser`), forcing every device/session
  to log in again.

See `authService.refresh()` in `backend/src/modules/auth/auth.service.js`.

## Logout & revocation

`POST /auth/logout` looks up the current refresh token by its cookie,
marks that single row `revoked = true`, and clears the cookie. It does
**not** revoke other sessions/devices - only the one calling logout. (Use
the reuse-detection path above, or a future "log out everywhere" admin
action, to revoke all of a user's sessions.)

## Cookie configuration

See `backend/src/modules/auth/auth.cookies.js`:

| Flag | Value | Why |
|---|---|---|
| `httpOnly` | `true` | JS can never read or exfiltrate it |
| `secure` | `true` in production | Only sent over HTTPS |
| `sameSite` | `"none"` in production, `"lax"` in dev | Frontend (Vercel) and backend (Render) are different domains in production, which requires `SameSite=None; Secure`; `lax` works for same-origin `localhost` dev without HTTPS |
| `path` | `${API_PREFIX}/auth` | Only sent to auth endpoints, not leaked to every API route |
| `maxAge` | `JWT_REFRESH_EXPIRES_MS` (30 days) | Matches the JWT's own expiry |

## Expired / cleaned-up tokens

Expired rows in `refresh_tokens` are not automatically deleted by this
upgrade (no cron job was added, to keep the change scope minimal). They're
already functionally inert (`authService.refresh` checks `expiresAt` and
rejects them), so leaving them is safe; a periodic cleanup job (`DELETE FROM
refresh_tokens WHERE expires_at < now()`) can be added later without any
API changes.
