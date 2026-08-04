# AgriCast AI — Analytics Module Guide

The Analytics module turns historical data already stored by the Weather,
AI Recommendation, Reports, and Farm modules into statistics, trends, and
summaries — without modifying Authentication, Farms, Weather, Satellite,
AI, or Reports. It is a **read-and-aggregate** layer: it owns no source-of-
truth data of its own except a short-lived computation cache.

---

## 1. Architecture

Follows the exact layered pattern already used by every other module in
this codebase (`auth`, `farms`, `weather`, `satellite`, `ai`, `reports`):

```
modules/analytics/
  analytics.routes.js       Express Router — auth + validation wiring
  analytics.controller.js   HTTP layer only — no business logic
  analytics.service.js      Business logic, ownership checks, date-range
                             resolution, cache-or-compute orchestration
  analytics.repository.js   Only layer that talks to Drizzle/DB
  analytics.validator.js    express-validator chains
  analytics.schema.js       Response DTOs (normalizes Postgres numeric
                             strings into real JSON numbers)

db/schema/analytics.schema.js   Drizzle table definition (analytics_cache only)
```

**Data flow for a typical request, e.g. `GET /analytics/weather/:farmId`:**

```
Controller → Service.getWeatherAnalytics()
  1. farmRepository.findByIdForUser()      → ownership check (existing repo, unmodified)
  2. buildCacheKey()                       → deterministic hash of (type, params)
  3. analyticsRepository.findCache()       → cache hit? return payload as-is
  4. (cache miss) analyticsRepository.getWeatherSummary()/getWeatherTrends()/
     getWeatherDistribution()              → aggregate queries against weather_history
  5. analyticsRepository.upsertCache()     → memoize for the type's TTL
  6. analytics.schema.js DTO               → shape + normalize for the frontend
```

Every method in `analytics.service.js` takes the authenticated `userId`
first and resolves farm ownership through the **existing** `farmRepository`
before doing anything else — the same rule `reports.service.js` and
`ai.service.js` already follow. Only two existing files received a
one-line addition each (no other line in either file was touched):

- `db/schema/index.js` — added `export * from "./analytics.schema.js";`
- `routes/index.js` — added `router.use("/analytics", analyticsRoutes);`

No file inside `modules/auth`, `modules/farms`, `modules/weather`,
`modules/satellite`, `modules/ai`, or `modules/reports` was modified.

---

## 2. Database

### Table: `analytics_cache`

Analytics deliberately does **not** duplicate `weather_history`,
`recommendations`, or `reports` — every number in an analytics response is
computed from those tables directly. `analytics_cache` exists purely as a
performance layer for the expensive aggregate queries (grouped trends over
a month, confidence trends, etc.), the same role `weather_cache` plays for
live Open-Meteo calls.

| Column | Type | Notes |
|---|---|---|
| `id` | uuid, PK | |
| `farm_id` | uuid, FK → `farms.id` (cascade) | |
| `cache_key` | varchar(255) | `<type>:<sha256-hash-of-params>`, e.g. `weather:9f2a...` |
| `payload` | jsonb | the fully computed DTO — a cache hit is a straight read, no recomputation |
| `computed_at` | timestamptz | when this payload was last (re)computed |
| `expires_at` | timestamptz | TTL boundary — see §6 |
| `created_at` / `updated_at` | timestamptz | |

Indexes:
- `analytics_cache_farm_id_cache_key_unique` (unique on `farm_id, cache_key`) — every cache lookup is "give me the row for this farm + key"
- `analytics_cache_expires_at_idx` — for a future sweep/cleanup job

### Migration

`0006_analytics_module.sql` (generated with the project's own
`drizzle-kit generate`, then manually pruned of unrelated no-op
constraint churn `drizzle-kit` proposed for `weather_cache` /
`satellite_cache` / `recommendations` / `reports` — those tables are
completely untouched by this migration). Ran successfully against a real
Postgres 16 instance as part of building this module; `\d analytics_cache`
was used to confirm the resulting table matches the schema exactly.

Apply with the project's existing command:

```bash
npm run db:migrate
```

---

## 3. API Documentation

Base path: `{{API_PREFIX}}/analytics` (i.e. `/api/v1/analytics` with the
project's default `.env`). Every route requires `Authorization: Bearer
<token>` and enforces farm ownership — a request for a farm you don't own
returns `404 Not Found`, same as every other module (never `403`, so a
guess can't distinguish "not yours" from "doesn't exist").

All responses use the project's standard envelope:
```json
{ "success": true, "message": "...", "data": { ... } }
```

### `GET /analytics/dashboard/:farmId`

One-shot summary for a farm's landing dashboard: farm stats, crop info,
last-30-days weather (summary + daily trend + weather-code distribution),
and the 5 most recent AI recommendations.

```json
{
  "data": {
    "farm": { "farmId": "...", "farmName": "...", "crop": "Wheat", "area": 5, "areaUnit": "acres",
               "location": { "village": "...", "district": "...", "state": "...", "country": "..." },
               "daysActive": 42, "reportCount": 3 },
    "crop": { "crop": "Wheat", "area": 5, "areaUnit": "acres" },
    "weather": { "summary": { "recordCount": 30, "temperature": { "avg": 27.4, "min": 19.1, "max": 34.2 }, "...": "..." },
                 "trends": [ { "period": "2026-07-05T00:00:00.000Z", "recordCount": 1, "temperature": { "...": "..." } } ],
                 "distribution": [ { "weatherCode": 0, "occurrences": 12 } ] },
    "recentRecommendations": [ { "id": "...", "summary": "...", "confidence": 85, "language": "en", "createdAt": "..." } ],
    "rangeDays": 30,
    "cached": false,
    "computedAt": "2026-08-03T20:35:06.156Z"
  }
}
```

### `GET /analytics/weather/:farmId`

Query params (all optional): `startDate`, `endDate` (ISO 8601 — default:
last 30 days), `granularity` (`day` \| `week` \| `month` — default `day`).

Returns Temperature/Rainfall/Humidity/Wind trends grouped by
`granularity`, the range-wide summary, and the weather-code distribution.

### `GET /analytics/recommendations/:farmId`

Query params: `startDate`, `endDate`, `granularity` (default `week`),
`limit` (1-100, default 20), `offset`.

Returns confidence summary/trend, language distribution, and the
paginated recommendation history (each entry's AI-generated summary +
confidence + language + date). See §7 for what "Recommendation Accuracy
Preparation" means today.

### `GET /analytics/monthly/:farmId`

Query params: `month` (`YYYY-MM`, default: current month). Weather +
recommendation blocks for the whole calendar month.

### `GET /analytics/weekly/:farmId`

Query params: `week` (ISO week `YYYY-Www`, default: current week — Monday
through Sunday). Weather + recommendation blocks for that week.

### `GET /analytics/summary/:farmId`

Query params: `date` (`YYYY-MM-DD`, default: today). Farm stats +
that day's weather + the 3 latest recommendations.

### Validation errors (`400`)

Every route validates its inputs with `express-validator` before touching
the service layer:
- `farmId` must be a valid UUID
- `granularity` must be one of `day`, `week`, `month`
- `month` must match `YYYY-MM`; `week` must match ISO `YYYY-Www`
- `startDate` / `endDate` / `date` must be valid ISO 8601
- `limit` 1-100, `offset` ≥ 0

---

## 4. Database Design (why aggregation, not duplication)

Every analytics number is computed with a Drizzle query against the
existing tables:

| Feature | Source table(s) | Aggregate |
|---|---|---|
| Temperature / Rainfall / Humidity / Wind Trends | `weather_history` | `avg`/`min`/`max`/`sum` grouped by `date_trunc(granularity, recorded_at)` |
| Weather Summary | `weather_history` | single-row `avg`/`min`/`max`/`sum` over the range |
| Weather Distribution | `weather_history` | `count(*)` grouped by `weather_code` |
| Recommendation History | `recommendations` | ordered, paginated read |
| Recommendation Accuracy Preparation | `recommendations` | confidence `avg`/`min`/`max` + trend over time (see §7) |
| Farm Statistics | `farms` + `reports` (count only) | days active, report count |
| Monthly / Weekly / Daily Summary | `weather_history` + `recommendations` | same building blocks, different date range |
| Crop Statistics | `farms` | today: the farm's own `crop`/`area` fields (see §7) |

`date_trunc()` takes its time-unit as a SQL literal, not a bind
parameter. `granularity` is restricted to a 3-value allowlist
(`day`/`week`/`month`) at both the validator layer **and** re-checked
inside `analytics.repository.js` (`truncUnit()`) before being used to
build the expression — no request-controlled string ever reaches SQL
text, so this stays fully injection-safe while still allowing grouping.

---

## 5. Aggregation Strategy

- **Trends** (`getWeatherTrends`, `getRecommendationConfidenceTrend`) group
  rows by `date_trunc(granularity, timestamp)` and return one row per
  period — used directly as chart-ready `{ period, ...metrics }[]` arrays.
- **Summaries** (`getWeatherSummary`, `getRecommendationSummary`) run a
  single ungrouped aggregate across the whole requested range — cheap,
  index-backed (`weather_history_farm_id_idx` + `weather_history_recorded_at_idx`,
  `recommendations_farm_id_idx` + `recommendations_created_at_idx` already
  exist from earlier modules).
- **Distributions** (`getWeatherDistribution`,
  `getRecommendationLanguageDistribution`) group by a categorical column
  and return `{ category, occurrences }[]`, sorted by frequency.
- Every numeric aggregate result is a Postgres string over the wire
  (node-pg doesn't auto-cast `numeric` aggregates) — `analytics.schema.js`
  normalizes every one of them through `toNumber()` before the response
  leaves the API, so the frontend never has to parse `"27.400000000000000000"`.

---

## 6. Caching Strategy

`getFromCacheOrCompute()` in `analytics.service.js` wraps every endpoint:

1. Build a deterministic `cacheKey` = `sha256(type + JSON(params))`,
   scoped by `farmId` (so two farms' `weather:...` keys never collide even
   with a hash truncated to 32 hex chars for storage compactness).
2. Look up `analytics_cache` for `(farmId, cacheKey)`. If found and
   `expires_at` is in the future, return the stored `payload` as-is —
   `cached: true` in the response.
3. On a miss (or expired row), run the real aggregate queries, `upsert`
   the result with a fresh `expires_at`, and return it — `cached: false`.

TTLs are deliberately different per analytics type, same reasoning as
`env.weather.cacheTtlSeconds`:

| Type | TTL | Why |
|---|---|---|
| `dashboard` | 15 min | Checked often; should feel close to live |
| `weather` | 30 min | Weather history changes on the hour at most |
| `recommendations` | 30 min | New recommendations are infrequent, user-triggered events |
| `monthly` | 6 hours | Barely changes within a day |
| `weekly` | 1 hour | |
| `summary` (daily) | 15 min | Today's numbers should feel current |

A cache **read** failure never breaks a request — it's logged and falls
through to a fresh computation. A cache **write** failure is also
non-fatal — the freshly computed result is still returned to the caller;
only the memoization is skipped. Caching is a performance optimization,
never a correctness dependency.

---

## 7. Future Extensions

- **Recommendation Accuracy**: today, `recommendations` stores the AI's
  own stated `confidence` at generation time but no record of the actual
  outcome (did the recommended action work?). This module tracks
  confidence *trends* as a proxy signal now; once a future module records
  real outcomes (e.g. a farmer confirms "irrigation helped" / "disease
  risk was accurate"), `getRecommendationAnalytics` can add a true
  accuracy metric without an API contract change — it already returns a
  `summary` + `confidenceTrend` shape ready to extend.
- **Crop Statistics**: `farms` currently stores a single `crop` string
  with no crop-cycle history. `buildCropStatistics()` is intentionally
  thin today (crop name + area) so the dashboard's "Crop" card has
  somewhere to render now; once a crop-cycle module exists, this function
  is the only place that needs to grow.
- **Sensor Analytics**: no sensor table exists yet. Every analytics
  service method and DTO is additive-only — a future `sensor_readings`
  table can be aggregated the same way `weather_history` is today and
  merged into the existing `weather` block (or a new `sensors` block)
  without changing any of the six existing route contracts, per the
  "support future sensor analytics without changing API contracts"
  requirement.
- **Cache sweeping**: `analytics_cache_expires_at_idx` exists for a future
  scheduled job (`DELETE FROM analytics_cache WHERE expires_at < now()`);
  not required today since expired rows are simply treated as misses and
  overwritten in place.

---

## 8. Testing

### Unit Testing Plan

`tests/unit/analytics.schema.test.js` — pure DTO-shaping functions, no DB:
- Postgres numeric strings (`"27.456789"`) normalize to rounded numbers
- A farm with zero weather history produces `null`/`[]` shapes, not errors
- `toRecommendationAnalyticsDto` / `toDashboardDto` compose nested blocks correctly

Run: `npm test` (uses Node's built-in test runner, no extra dependency —
same convention as `tests/unit/reports.generators.test.js`).

### Integration Testing Plan

`tests/integration/analytics.api.test.js` — full HTTP round-trip against
the real Express app + a real Postgres database (migrations applied):
- 401 without a token
- 400 on an invalid `farmId` / bad `granularity` / bad `month` format
- 404 for a farm the caller doesn't own (never leaks existence)
- All 6 endpoints return real, correctly-aggregated data (verified against
  seeded weather history and recommendations)
- Dashboard's second call within the TTL returns `cached: true`
- A farm with zero history returns clean empty shapes, not a crash
- A second user cannot read the first user's farm analytics (ownership
  isolation, not just data isolation)

**Both suites were run against a live Postgres 16 database while building
this module — 4/4 unit tests and 14/14 integration tests pass.**

To run only analytics tests:
```bash
node --test tests/unit/analytics.schema.test.js tests/integration/analytics.api.test.js
```

### Postman Examples

`docs/AgriCast-Analytics.postman_collection.json` — one request per
endpoint plus 3 deliberate error cases (missing token, invalid `farmId`,
invalid `granularity`). Set `{{baseUrl}}`, `{{token}}`, `{{farmId}}` in a
Postman environment before running.

### Testing Checklist

- [x] Dashboard returns farm + weather + crop + recent recommendations
- [x] Weather analytics respects `startDate`/`endDate`/`granularity`
- [x] Recommendation analytics returns confidence stats + history
- [x] Monthly summary resolves the correct calendar-month boundaries
- [x] Weekly summary resolves the correct ISO-week (Mon–Sun) boundaries
- [x] Daily summary defaults to "today" and accepts an explicit `date`
- [x] JWT required on every route (401 without it)
- [x] Farm ownership enforced on every route (404 for another user's farm)
- [x] Empty history (new farm) never crashes — returns null/empty shapes
- [x] Second dashboard call within TTL hits the cache (`cached: true`)
- [x] Invalid `farmId`/`granularity`/`month`/`week` rejected with 400

---

## 9. Common Errors

| Situation | Response | Cause |
|---|---|---|
| No `Authorization` header | `401 Unauthorized` | `requireAuth` middleware |
| Malformed/expired JWT | `401 Unauthorized` | `requireAuth` middleware |
| `farmId` not a UUID | `400 Bad Request` | `analytics.validator.js` |
| Farm doesn't exist, or belongs to another user | `404 Not Found` | `analytics.service.js` → `farmRepository.findByIdForUser` |
| `granularity` not `day`/`week`/`month` | `400 Bad Request` | `analytics.validator.js` |
| `month` not `YYYY-MM` / `week` not `YYYY-Www` | `400 Bad Request` | `analytics.validator.js` |
| Farm has no weather history yet | `200 OK` with `summary: { recordCount: 0, ...all null }`, `trends: []` | Graceful empty aggregate, not an error |
| Farm has no recommendations yet | `200 OK` with `summary: { totalCount: 0 }`, `history: []` | Graceful empty aggregate, not an error |
| Database unreachable | `500 Internal Server Error` | Propagates through the existing `error.middleware.js`, same as every other module |
| Cache read/write failure | Transparent — falls back to fresh computation | `analytics.service.js` catches and logs, never throws |

---

## 10. Folder Structure Summary

```
backend/
  src/
    db/
      schema/
        analytics.schema.js         (new)
        index.js                    (+1 line: barrel export)
      migrations/
        0006_analytics_module.sql   (new)
        meta/0006_snapshot.json     (new, generated by drizzle-kit)
    modules/
      analytics/                    (new module, 6 files)
        analytics.routes.js
        analytics.controller.js
        analytics.service.js
        analytics.repository.js
        analytics.validator.js
        analytics.schema.js
    routes/
      index.js                      (+2 lines: import + router.use)
  tests/
    unit/analytics.schema.test.js         (new)
    integration/analytics.api.test.js     (new)
docs/
  AgriCast-Analytics.postman_collection.json  (new)
  AnalyticsGuide.md                           (this file)
```
