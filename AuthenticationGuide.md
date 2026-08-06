# Authentication Guide

This is an **upgrade** to AgriCast AI's existing email/password authentication,
not a rewrite. Everything that worked before (register, login, `/auth/me`,
`requireAuth`) still works exactly the same way. This guide covers what was
added: Google OAuth, short-lived access tokens, rotating refresh tokens, and
roles.

## What changed vs. Phase 1

| | Before | After |
|---|---|---|
| Login methods | Email + password only | Email + password **and** Google |
| Token | One JWT, 7-day expiry, in `localStorage` | Access token (15m, in-memory on the frontend) + refresh token (30d, HttpOnly cookie) |
| Session restore | Read token from `localStorage` on load | Silently call `POST /auth/refresh` on load |
| Logout | Client-side only (drop the token) | Server-side revocation of the refresh token + client-side clear |
| Roles | None | `admin` / `farmer`, enforced with `authorize()` |
| `users` table | `passwordHash` required | `passwordHash` nullable (Google-only accounts), plus `avatarUrl`, `provider`, `providerId`, `role`, `isVerified` |

No existing table was dropped or renamed, no existing column was removed, and
no existing route path changed. See [`MigrationGuide.md`](./MigrationGuide.md)
for the exact schema diff.

## Endpoints

All endpoints are under the existing `API_PREFIX` (`/api/v1` by default), so
in practice: `/api/v1/auth/...`.

| Method | Path | Auth required | Notes |
|---|---|---|---|
| POST | `/auth/register` | No | Unchanged behavior, now also sets the refresh cookie |
| POST | `/auth/login` | No | Unchanged behavior, now also sets the refresh cookie |
| POST | `/auth/google` | No | **New.** Body: `{ "credential": "<Google ID token>" }` |
| POST | `/auth/refresh` | Refresh cookie | **New.** Rotates the refresh token, returns a new access token |
| POST | `/auth/logout` | Refresh cookie | **New.** Revokes the refresh token, clears the cookie |
| GET | `/auth/me` | Access token (Bearer) | Unchanged |

Full request/response schemas are in Swagger UI at `GET /api-docs` once the
backend is running, and in
[`docs/AgriCast-Auth.postman_collection.json`](./docs/AgriCast-Auth.postman_collection.json).

## Response shape

Every login-type endpoint (`register`, `login`, `google`, `refresh`) returns
the same shape:

```json
{
  "success": true,
  "message": "Logged in successfully",
  "data": {
    "user": { "id": "...", "fullName": "...", "email": "...", "avatarUrl": null, "provider": "local", "role": "farmer", "isVerified": false, "createdAt": "...", "updatedAt": "..." },
    "token": "<access-token>",
    "accessToken": "<access-token>"
  }
}
```

`token` is kept for backward compatibility with any code still reading
`data.token`. New code should read `data.accessToken`. The refresh token is
**never** in this JSON body - it's set as an HttpOnly cookie by the same
response (see [`SecurityGuide.md`](./SecurityGuide.md)).

## Frontend session lifecycle

1. **App load** - `AuthProvider` calls `POST /auth/refresh`. If the browser
   has a valid `refreshToken` cookie from a previous session, this silently
   restores the user and a fresh access token. If not (first visit, expired,
   or revoked), the user starts logged out - no error is shown for this.
2. **Login / Register / Google login** - each sets `user` and stores the
   returned access token in memory (`lib/axios.js`'s `tokenStorage`, not
   `localStorage`).
3. **Every API call** - the axios instance attaches
   `Authorization: Bearer <accessToken>` automatically.
4. **Access token expires (15m)** - the next API call gets a 401. The axios
   response interceptor transparently calls `/auth/refresh` once, retries
   the original request with the new token, and only surfaces an error to
   the UI if the refresh itself fails (meaning the user is fully logged
   out).
5. **Logout** - calls `POST /auth/logout` (revokes the refresh token
   server-side) then clears the in-memory access token.

See `frontend/src/context/AuthContext.jsx` and `frontend/src/lib/axios.js`.

## Roles & authorization

`users.role` is `'farmer'` by default; `'admin'` must be set manually (e.g.
directly in the database, or by a future admin-management endpoint - out of
scope for this upgrade). Protect a route with both middlewares in order:

```js
import { requireAuth } from "../../middlewares/auth.middleware.js";
import { authorize } from "../../middlewares/authorize.middleware.js";

router.get("/admin/users", requireAuth, authorize("admin"), controller.listUsers);
```

`requireAuth` populates `req.user = { id, email, role }`; `authorize(...)`
just checks `req.user.role` is in the allowed list.

## Related documents

- [`GoogleOAuthGuide.md`](./GoogleOAuthGuide.md) - setting up Google Cloud
  credentials and the exact verification flow
- [`RefreshTokenGuide.md`](./RefreshTokenGuide.md) - rotation, reuse
  detection, and revocation in detail
- [`SecurityGuide.md`](./SecurityGuide.md) - cookie flags, CORS, rate
  limiting, CSRF posture
- [`MigrationGuide.md`](./MigrationGuide.md) - database changes and rollout
  steps
