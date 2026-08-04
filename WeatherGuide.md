# AgriCast AI — Weather Module Guide

## 1. Module Overview

### Goal

Give every farm a weather backend: current conditions, a 24-hour hourly
forecast, a 7-day daily forecast, and queryable history — all derived from
Open-Meteo, all fetched **backend-only** (the frontend never calls
Open-Meteo directly and never sees an API key, because Open-Meteo needs
none but the pattern is kept consistent for future paid providers).

### What was built

- Two new tables: `weather_cache` (short-lived, one row per farm +
  forecast type) and `weather_history` (append-only readings per farm).
- An `integrations/weather/` layer that is the only code in the repo that
  knows Open-Meteo's URL shape and field names.
- A `modules/weather/` module following the exact `routes → controller →
  service → repository` layering of `modules/farms/`.
- Cache-first reads with per-type TTLs, automatic history backfill,
  retry-on-transient-failure for every outbound call, and ownership
  enforcement scoped to the authenticated user via the existing
  `farms` table.

### What was intentionally NOT changed

`auth`, `farms`, middlewares, `ApiError`, `ApiResponse`, `asyncHandler`,
`logger`, `jwtUtil`, `db.js` — all untouched. Three existing files were
*extended*, never rewritten: `db/schema/index.js`, `routes/index.js`,
`config/env.js` (see §9), plus `package.json` (added `axios`) and
`.env.example` (added weather config).

---

## 2. Folder Structure (new/changed only)

```
backend/src/
├── db/
│   ├── schema/
│   │   ├── weather.schema.js        # NEW — weather_cache + weather_history tables
│   │   └── index.js                  # CHANGED — re-exports weather tables
│   └── migrations/
│       ├── 0002_weather_module.sql   # NEW
│       └── meta/
│           ├── 0002_snapshot.json    # NEW
│           └── _journal.json         # CHANGED — registers migration 0002
├── integrations/
│   └── weather/                      # NEW — external API layer
│       ├── openMeteo.js              # Open-Meteo HTTP client (axios, retry, timeout)
│       └── weatherMapper.js          # raw Open-Meteo JSON → normalized internal shape
├── modules/
│   └── weather/                      # NEW module
│       ├── weather.routes.js
│       ├── weather.controller.js
│       ├── weather.service.js
│       ├── weather.repository.js
│       ├── weather.validation.js
│       └── weather.schema.js         # response DTO shaping (frontend-facing shape)
├── config/env.js                     # CHANGED — added env.weather.*
└── routes/index.js                   # CHANGED — mounts /weather
```

`weather.schema.js` (DTO shaping) is deliberately separate from
`db/schema/weather.schema.js` (Drizzle table definitions) — same filename,
different job, different folder. This mirrors how `integrations/` is kept
separate from `modules/`: each layer only knows the shape it owns.

---

## 3. Data Flow

```
GET /api/v1/weather/current/:farmId
        │
        ▼
weather.routes.js       - requireAuth, farmIdParamValidation
        ▼
weather.controller.js   - assertValid(), calls service, wraps in ApiResponse
        ▼
weather.service.js      - getOwnedFarmOrThrow(userId, farmId)
        │                   └─ farmRepository.findByIdForUser (reuses farms module)
        ▼
        cache check (weatherRepository.findCache) ──► fresh? ──► return cached payload
        │
        │ (miss / stale)
        ▼
openMeteo.js             - fetchForecast(lat, lng), retries on 5xx/timeout
        ▼
weatherMapper.js          - raw Open-Meteo JSON → { current, hourly, daily }
        ▼
weatherRepository          - upsertCache(farmId, type, payload, expiresAt) for all 3 blocks
                            - bulkUpsertHistory(farmId, hourly+daily) [best-effort]
        ▼
weather.schema.js          - toCurrentDto(data, meta) → clean response shape
        ▼
ApiResponse.send(res)      - { success, message, data }
```

`GET /history/:farmId` reads from `weather_history` first; only if the
requested range has no rows yet does it call Open-Meteo's **archive** API
(a different host than the forecast API) and backfill the table.

---

## 4. Database Design

### `weather_cache`

| Column          | Type                      | Notes                                   |
|-----------------|---------------------------|------------------------------------------|
| id              | uuid, PK                  | `gen_random_uuid()`                       |
| farm_id         | uuid, FK → farms.id       | `ON DELETE CASCADE`                      |
| forecast_type   | varchar(20)               | `current` \| `hourly` \| `daily`, checked |
| payload         | jsonb                     | normalized DTO, not raw Open-Meteo JSON  |
| fetched_at      | timestamptz               | default now()                            |
| expires_at      | timestamptz               | TTL boundary, checked on every read      |
| created_at/updated_at | timestamptz         |                                            |

- **Unique** `(farm_id, forecast_type)` — one live cache row per farm per
  block; a repeat fetch upserts in place instead of accumulating rows.
- Index on `expires_at` for future cleanup jobs.

### `weather_history`

| Column              | Type                | Notes                              |
|---------------------|---------------------|--------------------------------------|
| id                  | uuid, PK             |                                     |
| farm_id             | uuid, FK → farms.id  | `ON DELETE CASCADE`                |
| recorded_at         | timestamptz          | the reading's own timestamp        |
| temperature         | numeric(5,2)         |                                     |
| humidity            | numeric(5,2)         | checked 0–100                      |
| wind_speed          | numeric(6,2)         |                                     |
| wind_direction      | numeric(5,1)         |                                     |
| pressure            | numeric(7,2)         |                                     |
| rain_probability    | numeric(5,2)         | checked 0–100                      |
| uv_index            | numeric(4,1)         |                                     |
| weather_code        | integer               |                                     |
| source              | varchar(30)          | default `'open-meteo'`             |
| created_at          | timestamptz           |                                     |

- **Unique** `(farm_id, recorded_at)` — re-fetching the same hour/day
  upserts the reading instead of duplicating it.
- Indexes on `farm_id` and `recorded_at` for range queries.

Both tables cascade-delete with their farm — weather data has no meaning
once the farm it describes is gone.

---

## 5. API Documentation

All endpoints require `Authorization: Bearer <token>` and only return data
for farms owned by the authenticated user (404, not 403, if the farm
exists but belongs to someone else — same information-hiding convention
as the farms module).

### `GET /api/v1/weather/current/:farmId`

```json
{
  "success": true,
  "message": "Current weather fetched successfully",
  "data": {
    "farmId": "…",
    "observedAt": "2026-08-04T09:00",
    "temperature": 31.4,
    "humidity": 58,
    "pressure": 1008.2,
    "windSpeed": 11.3,
    "windDirection": 210,
    "uvIndex": 6.1,
    "weatherCode": 3,
    "units": { "temperature": "°C", "humidity": "%", "pressure": "hPa", "windSpeed": "km/h" },
    "cache": { "hit": false, "fetchedAt": "2026-08-04T09:01:02.000Z" }
  }
}
```

### `GET /api/v1/weather/hourly/:farmId`
Next 24 hours. `data.hourly[]` — `time, temperature, humidity,
rainProbability, pressure, windSpeed, windDirection, uvIndex, weatherCode`.

### `GET /api/v1/weather/daily/:farmId`
Next 7 days. `data.daily[]` — `date, temperatureMax, temperatureMin,
rainProbabilityMax, windSpeedMax, windDirectionDominant, uvIndexMax,
weatherCode`.

### `GET /api/v1/weather/history/:farmId?startDate=&endDate=`
Both query params optional (`YYYY-MM-DD`), default range is the last 7
days. `data.history[]` — same fields as hourly, plus `recordedAt` and
`source`.

All four return `400` on invalid `farmId`/dates, `404` if the farm doesn't
exist or isn't owned by the caller, `401` if unauthenticated, `500` (with
a friendly message) if Open-Meteo is unreachable after retries.

---

## 6. Error Handling

- **Timeouts**: `OPEN_METEO_TIMEOUT_MS` (default 8000ms) via axios.
- **Retry**: up to `OPEN_METEO_MAX_RETRIES` (default 2) with linear
  backoff (`OPEN_METEO_RETRY_DELAY_MS`), only for transient failures
  (network errors, timeouts, 5xx). A 4xx from Open-Meteo is treated as a
  caller bug and is not retried.
- **Graceful fallback**: if Open-Meteo is down and no fresh cache exists,
  the endpoint returns `500` with a friendly message rather than leaking
  the provider's raw error. If a stale cache row exists, current
  behavior is to still attempt a refresh (cache is only used when fresh);
  a future extension point is "serve stale-but-available on provider
  failure" (see §9).
- **History save is best-effort**: a failure to write `weather_history`
  after a successful forecast fetch is logged (`logger.warn`) but never
  fails the request — the caller already has the data they asked for.
- All errors funnel through the existing centralized `errorMiddleware`;
  weather introduces no new error-response shape.

---

## 7. Testing Checklist

1. **Auth guard**: call any weather endpoint with no `Authorization`
   header → expect `401`.
2. **Ownership**: log in as user A, call `/current/:farmId` with a farm
   belonging to user B → expect `404`.
3. **Validation**: call `/current/not-a-uuid` → expect `400` with
   validation details.
4. **Happy path (cache miss)**: call `/current/:farmId` for a real, owned
   farm → expect `200`, `data.cache.hit: false`, and a populated payload.
5. **Happy path (cache hit)**: call the same endpoint again immediately →
   expect `200`, `data.cache.hit: true`.
6. **Hourly/daily shape**: call `/hourly/:farmId` and `/daily/:farmId` →
   expect `count` matching array length, arrays sorted chronologically.
7. **History default range**: call `/history/:farmId` with no query
   params → expect the last 7 days.
8. **History explicit range**: call with `startDate`/`endDate` → expect
   only readings inside that window.
9. **History backfill**: call `/history/:farmId` for a farm with no prior
   history → expect a successful response and a subsequent DB read
   (`weather_history` row count > 0) without a second Open-Meteo call.
10. **Retry behavior** (manual/integration): point
    `OPEN_METEO_FORECAST_URL` at an unreachable host temporarily → expect
    `MAX_RETRIES + 1` attempts (visible in logs) before the `500`
    response.
11. **Cascade delete**: soft-delete a farm via the farms module, hard-check
    that a subsequent hard delete (if ever added) cascades weather rows —
    covered by the FK `ON DELETE CASCADE`, no app code required.

---

## 8. Common Issues

- **`Missing required environment variable: DATABASE_URL` on boot** — this
  is `config/env.js`, unrelated to weather; copy `.env.example` to `.env`.
- **`weather_cache_forecast_type_check` violation** — only happens if a
  caller bypasses the repository and inserts a `forecast_type` outside
  `current/hourly/daily` directly; the app never does this itself.
- **Empty `hourly`/`daily` arrays** — Open-Meteo occasionally omits a
  block for out-of-range coordinates; the mapper returns `[]` rather than
  throwing, so check the farm's stored `latitude`/`longitude` are valid.
- **History looks "stuck" on old data** — history is read-through-DB
  first; if you need to force a re-fetch from Open-Meteo, the current
  design has no explicit "invalidate history" endpoint (see §9).
- **Migration not applied** — this module ships its migration SQL and
  Drizzle snapshot hand-authored (no live DB/network was available while
  generating this module). Before running `npm run db:migrate`, sanity
  check `0002_weather_module.sql` against `db/schema/weather.schema.js`
  yourself, or regenerate cleanly with `npm run db:generate` against an
  empty diff and diff the two.

---

## 9. Files Changed (existing files extended, not rewritten)

- `backend/src/db/schema/index.js` — added
  `export * from "./weather.schema.js"`.
- `backend/src/routes/index.js` — added the `weatherRoutes` import and
  `router.use("/weather", weatherRoutes)`, replacing the placeholder
  comment that was already there.
- `backend/src/config/env.js` — added `env.weather` (Open-Meteo URLs,
  timeout/retry tuning, per-forecast-type cache TTLs).
- `backend/package.json` — added `axios` dependency.
- `backend/.env.example` — documented the new `OPEN_METEO_*` and
  `WEATHER_CACHE_TTL_*` variables.

## 10. Future Extension Points

- **Serve stale cache on provider outage** instead of failing the
  request, with a `data.cache.stale: true` flag.
- **Rain-alert / threshold notifications** built on top of
  `weather_history` (e.g. "notify if rain probability > 70% in next 24h").
- **Multi-provider support** — `integrations/weather/` was kept isolated
  specifically so a second provider (e.g. a paid, higher-resolution API)
  can be added as `integrations/weather/otherProvider.js` with its own
  mapper, without touching `modules/weather/`.
- **Background refresh job** — a scheduled task that refreshes
  `weather_cache` for farms with recent activity before their TTL expires,
  so users never see a cache-miss latency hit.
- **Frontend consumption** — this guide covers backend only, per this
  sprint's scope; a `features/weather/` frontend module (mirroring
  `features/farms/`) is the natural next step.
