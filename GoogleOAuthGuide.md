# Google OAuth Guide

AgriCast AI uses **Google Identity Services** (GIS) with the ID-token flow -
the frontend never talks to Google's token endpoint directly, and the
backend never sees a Google access token, only a signed ID token it
verifies itself.

## 1. Create Google OAuth credentials

1. Go to [Google Cloud Console](https://console.cloud.google.com/) →
   **APIs & Services → Credentials**.
2. **Create Credentials → OAuth client ID → Web application.**
3. Under **Authorized JavaScript origins**, add every origin the frontend
   is served from, e.g.:
   - `http://localhost:5173` (dev)
   - `https://your-app.vercel.app` (production)
4. You do **not** need to add an Authorized redirect URI for this flow - GIS
   renders the button/prompt directly on your page and returns the
   credential via a JS callback, no redirect involved.
5. Copy the generated **Client ID** (looks like
   `1234567890-abc...apps.googleusercontent.com`). You do not need the
   **Client Secret** for this flow (ID-token verification only needs the
   client ID as the expected audience), but it's included in the env
   templates in case a future server-to-server flow needs it.

## 2. Configure environment variables

**Backend** (`backend/.env`):
```
GOOGLE_CLIENT_ID=1234567890-abc...apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=
```

**Frontend** (`frontend/.env`):
```
VITE_GOOGLE_CLIENT_ID=1234567890-abc...apps.googleusercontent.com
```

Both must be the **same** client ID. If `GOOGLE_CLIENT_ID` is missing on the
backend, `/auth/google` responds `500` with a clear
"Google sign-in is not configured on this server" message - every other auth
flow (email/password) keeps working.

## 3. Flow

```
Frontend                         Backend                        Google
   |                                 |                              |
   | render <GoogleLogin/> button    |                              |
   |----------------------------------------------------------------|
   | user clicks, signs in ---------------------------------------->|
   |<---------------------------------------------------------------|
   | onSuccess({ credential })       |                              |
   |                                 |                              |
   | POST /api/v1/auth/google        |                              |
   | { credential }  --------------->|                              |
   |                                 | verifyIdToken(credential,     |
   |                                 |   audience=GOOGLE_CLIENT_ID) |
   |                                 |----------------------------->|
   |                                 |<-----------------------------|
   |                                 | payload: { sub, email,       |
   |                                 |   email_verified, name,      |
   |                                 |   picture }                  |
   |                                 |                              |
   |                                 | find user by providerId      |
   |                                 |   -> else find by email      |
   |                                 |      (link) -> else create   |
   |                                 |                              |
   |                                 | issue access + refresh token |
   |<--------------------------------|                              |
   | { user, token, accessToken }    |                              |
   | + Set-Cookie: refreshToken      |                              |
```

Implementation:
- Frontend: `frontend/src/features/auth/components/GoogleLoginButton.jsx`
  (wraps `@react-oauth/google`'s `<GoogleLogin>`), 
  `frontend/src/features/auth/hooks/useGoogleAuth.js`,
  `frontend/src/main.jsx` (wraps the app in `<GoogleOAuthProvider>`).
- Backend: `backend/src/integrations/auth/googleVerifier.js` (verification
  only - the only place a Google credential is trusted),
  `backend/src/modules/auth/auth.service.js`'s `googleLogin()`.

## 4. Account matching rules

- **Existing Google user** (matched by `provider = 'google' AND provider_id
  = <sub>`) → logs straight in.
- **New Google sign-in, but the email already has a local (password)
  account** → the Google identity is **linked** to that existing account
  (`provider_id` and `avatar_url` are backfilled, `is_verified` set to
  `true`). The user can then log in with **either** their password or
  Google - `passwordHash` is left untouched.
- **Brand-new email** → a new user row is created with `provider = 'google'`,
  `passwordHash = NULL`, `is_verified = true` (Google already verified the
  email address, so we trust it - no separate email-verification flow is
  needed for Google accounts).

## 5. Security notes

- The backend **never** trusts an email/name/picture sent in the request
  body - only the fields extracted from the verified ID token payload after
  `google-auth-library`'s `verifyIdToken()` succeeds are used.
- `email_verified` on the Google payload is checked; unverified Google
  emails are rejected with 401.
- Rate limiting (`authRateLimiter`, 30 req / 15 min / IP) applies to
  `/auth/google` the same as `/auth/login`.
