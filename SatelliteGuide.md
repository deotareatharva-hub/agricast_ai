# AgriCast AI — Satellite Module Guide

## 1. Module Overview

### Goal

Give every farm a satellite-imagery backend: true-color and false-color
imagery, NDVI, a moisture index, and EVI, plus scene metadata (capture
dates, cloud cover) — all derived from **Sentinel Hub**, all fetched
**backend-only**. The frontend never talks to Sentinel Hub directly and
never sees a Sentinel Hub credential or OAuth token.

### What was built

- Two new tables: `satellite_cache` (one row per farm + layer + exact
  request params, holding the last normalized Sentinel Hub image/metadata
  response) and `satellite_requests` (append-only audit log of every
  satellite request, success or failure).
- An `integrations/satellite/` layer that is the only code in the repo
  that knows Sentinel Hub's OAuth flow, request shape, and evalscripts.
- A `modules/satellite/` module following the exact `routes → controller →
  service → repository` layering of `modules/weather/` and
  `modules/farms/`.
- Cache-first reads keyed on the exact request (farm + layer + bbox +
  date range), automatic OAuth token refresh with a one-shot 401 retry,
  retry-on-transient-failure for every outbound Sentinel Hub call, an
  audit log for every request, and ownership enforcement scoped to the
  authenticated user via the existing `farms` table.

### What was intentionally NOT changed

`auth`, `farms`, `weather`, middlewares, `ApiError`, `ApiResponse`,
`asyncHandler`, `logger`, `jwtUtil`, `db.js` — all untouched. Three
existing files were *extended*, never rewritten: `db/schema/index.js`,
`routes/index.js`, `config/env.js` (see §9), plus `.env.example` (added
satellite config). `package.json` did **not** need to change — `axios` is
already a dependency (added for the weather module).

---

## 2. Folder Structure (new/changed only)

```
backend/src/
├── db/
│   ├── schema/
│   │   ├── satellite.schema.js       # NEW — satellite_cache + satellite_requests tables
│   │   └── index.js                   # CHANGED — re-exports satellite tables
│   └── migrations/
│       ├── 0003_satellite_module.sql  # NEW
│       └── meta/
│           ├── 0003_snapshot.json     # NEW
│           └── _journal.json          # CHANGED — registers migration 0003
├── integrations/
│   └── satellite/                     # NEW — external API layer
│       ├── sentinel.js                # Sentinel Hub Process/Catalog API client (axios, retry, evalscripts)
│       ├── sentinelMapper.js          # raw Sentinel Hub responses → normalized internal shape
│       └── tokenManager.js            # OAuth client-credentials token cache + auto-refresh
├── modules/
│   └── satellite/                     # NEW module
│       ├── satellite.routes.js
│       ├── satellite.controller.js
│       ├── satellite.service.js
│       ├── satellite.repository.js
│       ├── satellite.validator.js
│       └── satellite.schema.js        # response DTO shaping (frontend-facing shape)
├── config/env.js                      # CHANGED — added env.satellite.*
└── routes/index.js                    # CHANGED — mounts /satellite
```

`satellite.schema.js` (DTO shaping, in `modules/satellite/`) is
deliberately separate from `db/schema/satellite.schema.js` (Drizzle table
definitions) — same filename, different job, different folder, same
convention as the weather module.

---

## 3. OAuth Flow

Sentinel Hub uses OAuth2 client-credentials — one token per **registered
client**, not per user, so it's cached process-wide rather than per
request:

```
satellite.service.js needs a Sentinel Hub call
        │
        ▼
sentinel.js: callSentinel(buildRequest)
        │
        ▼
tokenManager.getToken()
        │
        ├─ cached token fresh (>60s left)? ──► return cached accessToken
        │
        ├─ refresh already in-flight? ──► await the SAME in-flight promise
        │                                  (dedupes concurrent refreshes)
        │
        └─ otherwise: POST {SENTINEL_OAUTH_URL}
                      grant_type=client_credentials
                      client_id / client_secret (from env, never logged)
                      → cache { accessToken, expiresAt }
        ▼
sentinel.js sends the actual Process/Catalog request with
`Authorization: Bearer <token>`
        │
        └─ 401 response? ──► tokenManager.invalidate(), fetch ONE fresh
                              token, retry the request exactly once
```

The client secret never leaves `tokenManager.js`; the access token never
leaves `sentinel.js`. Nothing else in the codebase — service, controller,
repository, frontend — ever sees either value.

---

## 4. Data Flow

```
GET /api/v1/satellite/image/:farmId?layer=NDVI&startDate=&endDate=
        │
        ▼
satellite.routes.js       - requireAuth, imageQueryValidation
        ▼
satellite.controller.js   - assertValid(), defaults layer to TRUE_COLOR, calls service
        ▼
satellite.service.js      - getOwnedFarmOrThrow(userId, farmId)
        │                    └─ farmRepository.findByIdForUser (reuses farms module)
        │                  - computeBoundingBox(farm.latitude, farm.longitude, buffer)
        │                  - resolveDateRange(startDate, endDate) → default last 10 days
        │                  - paramsHash = sha256({ bbox, dateRange, layer, width, height })
        ▼
        cache check (satelliteRepository.findCache) ──► fresh? ──► return cached image
        │
        │ (miss / stale)
        ▼
sentinel.js                - fetchImage(bbox, dateRange, layer, width, height)
                              (OAuth via tokenManager, retries on 5xx/timeout)
        ▼
sentinelMapper.js           - raw image bytes → { imageBase64, mimeType, sizeBytes }
        ▼
satelliteRepository          - upsertCache(...) for this exact farm+layer+params
                              - logRequest(status: "success") [best-effort]
        ▼
satellite.schema.js          - toImageDto(data, meta) → clean response shape
        ▼
ApiResponse.send(res)        - { success, message, data }
```

`GET /metadata/:farmId` follows the same ownership/bbox/date-range steps
but calls `sentinelClient.fetchMetadata` (Catalog API search — scene list,
capture dates, cloud cover) instead of `fetchImage`, and is **not**
cached through `satellite_cache`'s image columns — every metadata call is
still logged to `satellite_requests`.

`GET /layers` needs no farm, no cache, and no Sentinel Hub call at all —
it's a static, hardcoded list of the evalscripts `sentinel.js` currently
implements.

---

## 5. Database Design

### `satellite_cache`

| Column            | Type                | Notes                                          |
|-------------------|---------------------|--------------------------------------------------|
| id                | uuid, PK             | `gen_random_uuid()`                             |
| farm_id           | uuid, FK → farms.id  | `ON DELETE CASCADE`                             |
| layer             | varchar(30)          | `TRUE_COLOR \| FALSE_COLOR \| NDVI \| MOISTURE_INDEX \| EVI`, checked |
| params_hash       | varchar(64)          | sha256 of `{bbox, dateRange, layer, width, height}` |
| bbox              | jsonb                 | `[minLng, minLat, maxLng, maxLat]`             |
| date_range        | jsonb                 | `{ from, to }` (YYYY-MM-DD)                    |
| response_metadata | jsonb                 | e.g. `{ sizeBytes }` — never the raw Sentinel response |
| image_base64      | text, nullable        | base64 image bytes                             |
| image_mime_type   | varchar(50), nullable |                                                  |
| request_time      | timestamptz           | default now()                                  |
| expires_at        | timestamptz            | TTL boundary, checked on every read            |
| created_at/updated_at | timestamptz        |                                                  |

- **Unique** `(farm_id, layer, params_hash)` — a farm can have *many*
  cache rows per layer (one per distinct bbox/date-range combination
  requested so far); a repeat request for the exact same params upserts
  in place instead of accumulating duplicate rows. This differs from
  `weather_cache`'s simpler `(farm_id, forecast_type)` key because
  satellite requests carry a caller-supplied date range, weather forecast
  blocks don't.
- Index on `expires_at` for future cleanup jobs.

### `satellite_requests`

| Column             | Type                | Notes                                    |
|--------------------|----------------------|--------------------------------------------|
| id                 | uuid, PK              |                                            |
| farm_id            | uuid, FK → farms.id   | `ON DELETE CASCADE`                       |
| user_id            | uuid, FK → users.id   | `ON DELETE CASCADE`                       |
| layer              | varchar(30)           |                                            |
| bbox               | jsonb                  |                                            |
| date_range         | jsonb                  |                                            |
| status             | varchar(20)            | `success \| error`, checked              |
| response_metadata  | jsonb, nullable        | e.g. `{ sizeBytes }` or `{ sceneCount }` |
| error_message      | text, nullable         | populated only when status = error       |
| request_time       | timestamptz            | default now()                             |
| expires_at         | timestamptz, nullable  | mirrors the cache row's TTL when one was written; null for metadata-only or failed requests |
| created_at         | timestamptz            |                                            |

- Append-only — every request writes exactly one row, never updated.
- Indexes on `farm_id`, `user_id`, and `request_time` for audit queries
  ("show me every satellite call for this farm", "how many satellite
  calls did this user make this week").

Both tables cascade-delete with their farm — satellite data has no
meaning once the farm it describes is gone. `satellite_requests` also
cascade-deletes with its user for the same reason.

---

## 6. API Documentation

All endpoints require `Authorization: Bearer <token>` and only return
data for farms owned by the authenticated user (404, not 403, if the farm
exists but belongs to someone else — same information-hiding convention
as the farms/weather modules).

### `GET /api/v1/satellite/layers`

No farm, no auth-scoped data — just the list of supported layers.

```json
{
  "success": true,
  "message": "Supported satellite layers fetched successfully",
  "data": {
    "count": 5,
    "layers": [
      { "id": "TRUE_COLOR", "label": "True Color", "description": "Natural-color image, as the human eye would see the field." },
      { "id": "FALSE_COLOR", "label": "False Color (Vegetation Highlight)", "description": "..." },
      { "id": "NDVI", "label": "NDVI (Vegetation Index)", "description": "..." },
      { "id": "MOISTURE_INDEX", "label": "Moisture Index", "description": "..." },
      { "id": "EVI", "label": "Enhanced Vegetation Index", "description": "..." }
    ]
  }
}
```

### `GET /api/v1/satellite/image/:farmId?layer=&startDate=&endDate=`

`layer` optional (default `TRUE_COLOR`), `startDate`/`endDate` optional
(`YYYY-MM-DD`, default last 10 days ending today).

```json
{
  "success": true,
  "message": "Satellite imagery fetched successfully",
  "data": {
    "farmId": "…",
    "layer": "NDVI",
    "bbox": [75.9012, 17.6598, 75.9124, 17.6702],
    "dateRange": { "from": "2026-07-25", "to": "2026-08-04" },
    "mimeType": "image/png",
    "imageBase64": "iVBORw0KGgoAAAANSUhEUgAA...",
    "sizeBytes": 48213,
    "cache": { "hit": false, "fetchedAt": "2026-08-04T09:01:02.000Z" }
  }
}
```

### `GET /api/v1/satellite/metadata/:farmId?layer=&startDate=&endDate=`

Same params as `/image`. Returns the scene list from Sentinel Hub's
Catalog API without rendering an image.

```json
{
  "success": true,
  "message": "Satellite metadata fetched successfully",
  "data": {
    "farmId": "…",
    "layer": "NDVI",
    "bbox": [75.9012, 17.6598, 75.9124, 17.6702],
    "dateRange": { "from": "2026-07-25", "to": "2026-08-04" },
    "sceneCount": 2,
    "scenes": [
      { "sceneId": "S2A_...", "capturedAt": "2026-08-02T05:12:31Z", "cloudCoverPercent": 8.4 },
      { "sceneId": "S2B_...", "capturedAt": "2026-07-28T05:12:41Z", "cloudCoverPercent": 21.7 }
    ]
  }
}
```

All three return `400` on invalid `farmId`/`layer`/dates, `404` if the
farm doesn't exist or isn't owned by the caller, `401` if unauthenticated,
`500` (friendly message) if Sentinel Hub is unreachable/misconfigured
after retries.

---

## 7. Error Handling

- **Missing credentials**: if `SENTINEL_CLIENT_ID`/`SENTINEL_CLIENT_SECRET`
  aren't set, `tokenManager.getToken()` throws `ApiError.internal`
  ("Satellite imagery is not configured on this server.") the moment a
  satellite endpoint is actually called — the server still boots and every
  other module works fine.
- **Token expiration**: handled proactively (refreshed 60s before actual
  expiry) and reactively (a 401 from Sentinel Hub triggers
  `tokenManager.invalidate()` + one fresh-token retry inside `sentinel.js`).
- **Timeouts**: `SENTINEL_TIMEOUT_MS` (default 15000ms) via axios.
- **Retry**: up to `SENTINEL_MAX_RETRIES` (default 2) with linear backoff
  (`SENTINEL_RETRY_DELAY_MS`), only for transient failures (network
  errors, timeouts, 5xx) — same convention as `integrations/weather/openMeteo.js`.
  A non-401 4xx (bad bbox, malformed evalscript) is treated as a caller
  bug and is not retried.
- **Invalid farm**: `farmRepository.findByIdForUser` returning null →
  `ApiError.notFound("Farm not found")`, same as every other farm-scoped
  module.
- **Graceful fallback**: if Sentinel Hub is down and no fresh cache
  exists, the endpoint returns `500` with a friendly message rather than
  leaking Sentinel Hub's raw error body (which could include request
  internals).
- **Audit logging is best-effort**: a failure to write `satellite_requests`
  is logged (`logger.warn`) but never fails the actual request — the
  caller already has (or was denied) the data they asked for.
- All errors funnel through the existing centralized `errorMiddleware`;
  satellite introduces no new error-response shape.

---

## 8. Performance

- **Cache-first**: `satellite_cache` is keyed on the exact
  `(farmId, layer, paramsHash)` triple, so identical repeat requests never
  reach Sentinel Hub. Default TTL is 6 hours (`SATELLITE_CACHE_TTL_SECONDS`)
  — deliberately much longer than weather's, since Sentinel-2's revisit
  time is measured in days, not minutes.
- **Token reuse**: one OAuth token is shared across all requests and all
  users process-wide; concurrent cache-misses under load share a single
  in-flight token refresh instead of firing N OAuth calls.
- **Small, capped output size**: image requests default to a 512×512 PNG
  (`SATELLITE_IMAGE_WIDTH`/`HEIGHT`), keeping both the Sentinel Hub
  request and the cached payload small.

---

## 9. Files Changed (existing files extended, not rewritten)

- `backend/src/db/schema/index.js` — added
  `export * from "./satellite.schema.js"`.
- `backend/src/routes/index.js` — added the `satelliteRoutes` import and
  `router.use("/satellite", satelliteRoutes)`.
- `backend/src/config/env.js` — added `env.satellite` (Sentinel Hub OAuth/
  Process/Catalog URLs, credentials, timeout/retry tuning, bbox buffer,
  image size, cache TTL, default date-range length). Sentinel credentials
  were **not** added to the `required` startup-check list — see §7.
- `backend/.env.example` — documented the new `SENTINEL_*` and
  `SATELLITE_*` variables.

`package.json` was **not** changed — `axios` was already a dependency.

---

## 10. Testing

### Manual checklist

1. **Auth guard**: call any satellite endpoint with no `Authorization`
   header → expect `401`.
2. **Ownership**: log in as user A, call `/image/:farmId` with a farm
   belonging to user B → expect `404`.
3. **Validation**: call `/image/not-a-uuid` → expect `400`; call
   `/image/:farmId?layer=NOT_A_LAYER` → expect `400` listing valid layers.
4. **Missing credentials**: with `SENTINEL_CLIENT_ID`/`SECRET` unset, call
   `/image/:farmId` → expect `500` with "Satellite imagery is not
   configured on this server." and a `satellite_requests` row with
   `status = 'error'`.
5. **Happy path (cache miss)**: with real credentials, call
   `/image/:farmId` for an owned farm → expect `200`,
   `data.cache.hit: false`, a populated `imageBase64`.
6. **Happy path (cache hit)**: call the same endpoint + same
   layer/date-range again immediately → expect `200`,
   `data.cache.hit: true`, no new Sentinel Hub call (check logs).
7. **Different params, same farm**: call with a different `layer` or
   `startDate`/`endDate` → expect a **separate** cache row (not a
   cache hit) — this exercises the `(farm, layer, paramsHash)` key.
8. **Metadata**: call `/metadata/:farmId` → expect `200` with
   `sceneCount` matching `scenes.length`, sorted newest-first.
9. **Layers**: call `/layers` (no farm) → expect `200` with all 5 layers,
   no DB or Sentinel Hub call required.
10. **Retry behavior** (manual/integration): point `SENTINEL_PROCESS_URL`
    at an unreachable host temporarily → expect `SENTINEL_MAX_RETRIES + 1`
    attempts (visible in logs) before the `500` response.
11. **Token refresh**: manually expire the cached token (or wait past its
    lifetime) and issue a request → expect exactly one new OAuth call in
    the logs, not one per concurrent request.
12. **Cascade delete**: soft-delete a farm via the farms module; a
    subsequent hard delete (if ever added) cascades `satellite_cache` and
    `satellite_requests` rows — covered by the FK `ON DELETE CASCADE`, no
    app code required.

### Postman examples

Import as a Postman environment with `baseUrl = http://localhost:5000/api/v1`
and `token = <JWT from POST /auth/login>`.

**Get supported layers**
```
GET {{baseUrl}}/satellite/layers
Authorization: Bearer {{token}}
```

**Get NDVI image for a farm, default date range**
```
GET {{baseUrl}}/satellite/image/{{farmId}}?layer=NDVI
Authorization: Bearer {{token}}
```

**Get true-color image for an explicit date range**
```
GET {{baseUrl}}/satellite/image/{{farmId}}?layer=TRUE_COLOR&startDate=2026-07-01&endDate=2026-07-15
Authorization: Bearer {{token}}
```

**Get scene metadata (cloud cover, capture dates)**
```
GET {{baseUrl}}/satellite/metadata/{{farmId}}?layer=NDVI
Authorization: Bearer {{token}}
```

**Expected error — farm not owned by caller**
```
GET {{baseUrl}}/satellite/image/{{someoneElsesFarmId}}
Authorization: Bearer {{token}}

→ 404
{ "success": false, "message": "Farm not found", "data": null }
```

---

## 11. Common Issues

- **`Satellite imagery is not configured on this server.`** —
  `SENTINEL_CLIENT_ID`/`SENTINEL_CLIENT_SECRET` are blank in `.env`. Create
  an OAuth client in the Sentinel Hub dashboard and fill both in; no other
  module is affected by leaving these blank.
- **`satellite_cache_layer_check` violation** — only happens if a caller
  bypasses the repository and inserts a `layer` outside the 5 supported
  values directly; the app never does this itself (`assertLayerSupported`
  rejects unsupported layers before any DB write).
- **Every request is a cache miss** — check that `startDate`/`endDate`
  aren't drifting (e.g. a client always sending "today" as `endDate`
  produces a new `paramsHash` every day, which is expected — satellite
  scenes for a fixed window are exactly what should be cached).
- **`imageBase64` is very large in Postman** — expected; a 512×512 PNG is
  typically 30–80 KB, ~1.3× larger once base64-encoded. Reduce
  `SATELLITE_IMAGE_WIDTH`/`HEIGHT` for lighter payloads.
- **Migration not applied** — this module ships its migration SQL and
  Drizzle snapshot hand-authored (no live DB/network was available while
  generating this module — same situation the weather module's guide
  documents in its own §8). Before running `npm run db:migrate`, sanity
  check `0003_satellite_module.sql` against
  `db/schema/satellite.schema.js` yourself, or regenerate cleanly with
  `npm run db:generate` against an empty diff and diff the two.

---

## 12. Future NDVI / Vegetation Extension

The current `NDVI`, `MOISTURE_INDEX`, and `EVI` layers already return raw
single-band FLOAT32 index values as an image — this is the foundation for:

- **Per-pixel statistics** — Sentinel Hub's Statistical API can return
  min/max/mean/percentiles for a bbox+date range without rendering an
  image at all; a natural `GET /satellite/stats/:farmId?layer=NDVI` next
  step, using the same bbox/date-range/ownership logic already in
  `satellite.service.js`.
- **Time-series NDVI** — repeated `/metadata` calls already return every
  available scene in a range; a follow-up could fetch NDVI stats *per
  scene* and chart vegetation trend over a season.
- **Colorized rendering** — the current NDVI/MOISTURE_INDEX/EVI
  evalscripts output raw FLOAT32 values (not a color ramp) so the
  frontend or a future endpoint can apply its own color scale; a
  `?colorized=true` flag could add a second evalscript variant that
  outputs an RGB color-mapped PNG instead.
- **Field-level polygons** — once farms support a stored polygon (rather
  than just lat/lng), `computeBoundingBox` in `satellite.service.js` is
  the single place to swap the buffered-point bbox for the farm's actual
  boundary — no other file in the satellite module needs to change.
- **Alerting** — combine with `weather_history`-style trend storage (e.g.
  a future `ndvi_history` table) to power "vegetation health dropped
  >15% week-over-week" notifications.
