# Migration Guide - Authentication Upgrade

## Database changes

One new migration: `backend/src/db/migrations/0007_auth_google_oauth_upgrade.sql`,
generated with `drizzle-kit generate` against the updated schema files (not
hand-written), so it's consistent with every prior migration in this repo.

**Entirely additive** - no table dropped, no column removed, no existing
column renamed or retyped in a breaking way:

```sql
-- users: extended, not replaced
ALTER TABLE "users" ALTER COLUMN "password_hash" DROP NOT NULL;
ALTER TABLE "users" ADD COLUMN "avatar_url" varchar(512);
ALTER TABLE "users" ADD COLUMN "provider" varchar(20) DEFAULT 'local' NOT NULL;
ALTER TABLE "users" ADD COLUMN "provider_id" varchar(255);
ALTER TABLE "users" ADD COLUMN "role" varchar(20) DEFAULT 'farmer' NOT NULL;
ALTER TABLE "users" ADD COLUMN "is_verified" boolean DEFAULT false NOT NULL;

-- refresh_tokens: brand new table
CREATE TABLE "refresh_tokens" ( ... );
```

The only change that touches existing rows is dropping `NOT NULL` on
`password_hash` - a widening change, never a narrowing one. Every existing
row automatically gets `provider = 'local'` and `role = 'farmer'` via the
column defaults, so existing users keep logging in with their password
exactly as before, and are treated as regular (non-admin) farmers.

## Applying the migration

Same as every other migration in this project - nothing new to learn:

```bash
cd backend
npm install        # picks up the new deps (see below)
npm run db:migrate
```

## New backend dependencies

Added to `backend/package.json` (`npm install` picks these up automatically):

| Package | Used for |
|---|---|
| `google-auth-library` | Verifying Google ID tokens |
| `cookie-parser` | Reading the refresh-token cookie |
| `express-rate-limit` | Rate limiting auth endpoints |
| `uuid` | (transitive; refresh-token IDs use `crypto.randomUUID()`, no extra runtime dep needed beyond Node's own `crypto`) |
| `swagger-jsdoc`, `swagger-ui-express` | `/api-docs` |

## New frontend dependency

`@react-oauth/google` - wraps Google Identity Services for React.

## Environment variables

**Backend** - appended to `.env` / `.env.example`, nothing existing removed:

```
FRONTEND_URL=http://localhost:5173
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
JWT_ACCESS_EXPIRES_IN=15m
JWT_REFRESH_SECRET=replace_this_with_a_different_long_random_string_min_32_chars
JWT_REFRESH_EXPIRES_IN=30d
JWT_REFRESH_EXPIRES_MS=2592000000
```

`JWT_SECRET` and `JWT_EXPIRES_IN` (existing vars) are still read and still
work - they're now specifically the access-token secret/expiry.
**Action required:** set a real, different value for `JWT_REFRESH_SECRET`
before deploying (a placeholder is in `.env.example` only).

**Frontend** - appended to `.env` / `.env.example`:

```
VITE_GOOGLE_CLIENT_ID=
```

**Action required:** set both `GOOGLE_CLIENT_ID` (backend) and
`VITE_GOOGLE_CLIENT_ID` (frontend) to the *same* value from
[`GoogleOAuthGuide.md`](./GoogleOAuthGuide.md) before Google sign-in will
work. Every other auth flow (email/password) works with these left blank.

## Breaking changes for API consumers

None for existing consumers of `/auth/register`, `/auth/login`, `/auth/me` -
same request bodies, same response shape (`data.user`, `data.token`), same
status codes. The only behavioral addition is that these three responses
now also set a `refreshToken` cookie, which a consumer that doesn't use
cookies can simply ignore.

New optional capability: call `POST /auth/refresh` before the 15-minute
access token expires (or let a 401 trigger it) to keep a session alive
without re-prompting for credentials; call `POST /auth/logout` to revoke it
server-side instead of just discarding the token client-side.

## Rollback

If you need to roll back:
1. Revert the backend/frontend code changes (git revert this upgrade's
   commits).
2. The migration is additive, so **you do not have to reverse it** for the
   old code to keep working - `password_hash` being nullable and the extra
   columns/table being present don't affect the old Phase-1 code, which
   never reads or writes them. If you want the schema fully reverted too,
   drop `refresh_tokens` and drop the five added `users` columns (leave
   `password_hash` nullable rather than restoring `NOT NULL`, in case any
   Google-only rows were created in the meantime).
