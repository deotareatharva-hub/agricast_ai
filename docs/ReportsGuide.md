# AgriCast AI — Reports Module Guide

The Reports module generates downloadable PDF, CSV, and JSON reports that
combine Farm details, Weather, AI Recommendation, Satellite metadata, and
Sensor snapshot data for a farm — without modifying Authentication, Farms,
Weather, Satellite, or AI modules.

---

## 1. Architecture

Follows the exact layered pattern already used by every other module in
this codebase (`auth`, `farms`, `weather`, `satellite`, `ai`):

```
modules/reports/
  reports.routes.js       Express Router — auth + validation wiring
  reports.controller.js   HTTP layer only — no business logic
  reports.service.js      Business logic, ownership checks, orchestration
  reports.repository.js   Only layer that talks to Drizzle/DB
  reports.validator.js    express-validator chains
  reports.schema.js       Response DTOs (hides internal columns)

integrations/reports/
  reportDataAggregator.js Gathers farm + weather + AI + satellite + sensor
  pdfGenerator.js          Renders a snapshot to PDF (PDFKit)
  csvGenerator.js          Renders a snapshot to CSV (hand-rolled, no dep)

utils/fileStorage.js       Local-disk storage for generated report files
db/schema/reports.schema.js  Drizzle table definition
```

**Data flow for `POST /reports/generate`:**

```
Controller → Service.generate()
  1. farmRepository.findByIdForUser()      → ownership check
  2. reportDataAggregator.gather()         → farm + weather + satellite + AI + sensor
  3. computeContentHash()                  → dedup key
  4. reportsRepository.findLatestByContentHash() (skipped if forceRegenerate)
       → if a matching file still exists on disk, return it (no regeneration)
  5. pdfGenerator / csvGenerator / JSON.stringify → Buffer
  6. fileStorage.save()                    → writes to storage/reports/<farmId>/<reportId>.<ext>
  7. reportsRepository.create()            → persists metadata row
```

Every method in `reports.service.js` takes the authenticated `userId`
first and resolves farm/report ownership through the **existing**
`farmRepository`/`reportsRepository` before doing anything else — the
same rule `ai.service.js`, `weather.service.js`, and
`satellite.service.js` already follow. No other module's file was
modified to build this except two one-line additions:

- `db/schema/index.js` — added `export * from "./reports.schema.js";`
- `routes/index.js` — added `router.use("/reports", reportRoutes);`

---

## 2. Database

### Table: `reports`

| Column | Type | Notes |
|---|---|---|
| `id` | uuid, PK | |
| `farm_id` | uuid, FK → `farms.id` (cascade) | |
| `generated_by` | uuid, FK → `users.id` (cascade) | the requesting user; every query filters on this |
| `report_type` | varchar(30) | `today` \| `weekly` \| `monthly` \| `recommendation` |
| `file_type` | varchar(10) | `pdf` \| `csv` \| `json` |
| `status` | varchar(20) | `completed` \| `failed` |
| `download_url` | text, nullable | relative path under `storage/reports/`, null when `status = 'failed'` |
| `metadata` | jsonb | full data snapshot the report was built from + `contentHash` (+ `error` if failed) |
| `generated_at` | timestamptz | |
| `created_at` | timestamptz | |

Indexes: `generated_by`, `farm_id`, `generated_at`. Check constraints
enforce the enum-like columns at the DB level, same convention as
`recommendations_language_check` in the AI module.

### Migration

`src/db/migrations/0005_reports_module.sql` (+ matching
`meta/0005_snapshot.json` and a new `_journal.json` entry) was generated
by hand to exactly match `drizzle-kit generate`'s output format, continuing
the existing numbered-migration sequence (`0000`…`0004`). Apply it the
same way as every other migration:

```bash
npm run db:migrate
```

No existing table, migration, or schema file was modified.

---

## 3. API

All routes are mounted under `/api/v1/reports` and require
`Authorization: Bearer <token>` (via the existing `requireAuth`
middleware). A user can only see/act on reports where `generated_by`
matches their own id.

| Method | Path | Description |
|---|---|---|
| `POST` | `/reports/generate` | Generate a report |
| `GET` | `/reports` | List the caller's reports (filterable) |
| `GET` | `/reports/:id` | Get one report + its data snapshot |
| `GET` | `/reports/:id/download` | Stream the generated file |
| `DELETE` | `/reports/:id` | Delete a report (row + file) |

> `GET /:id/download` is an addition beyond the original 4-endpoint spec.
> It exists because `download_url` must resolve to something a client can
> actually fetch, and statically serving `storage/reports/` directly would
> bypass per-user ownership checks — a hard requirement under **Security**.
> The DTO's `downloadUrl` field already points here, so no extra wiring is
> needed on the frontend.

### POST /reports/generate

```json
{
  "farmId": "uuid",
  "reportType": "today | weekly | monthly | recommendation",
  "fileType": "pdf | csv | json",
  "forceRegenerate": false
}
```

Response `201`:

```json
{
  "success": true,
  "message": "Report generated successfully",
  "data": {
    "id": "uuid",
    "farmId": "uuid",
    "reportType": "today",
    "fileType": "pdf",
    "status": "completed",
    "downloadUrl": "/api/v1/reports/<id>/download",
    "generatedAt": "2026-08-04T10:00:00.000Z",
    "createdAt": "2026-08-04T10:00:00.000Z"
  }
}
```

If an identical report (same farm/type/fileType/underlying data) already
exists and `forceRegenerate` was not set, the **existing** row is
returned instead of generating a new file, with
`message: "An identical report already exists; returning the existing file."`

### GET /reports

Query params: `farmId`, `reportType`, `limit` (1–100, default 20),
`offset` (default 0).

### GET /reports/:id

Returns the report plus its full data snapshot (`data.farm`,
`data.weather`, `data.aiRecommendation`, `data.satellite`,
`data.sensorSnapshot`) — useful for a "preview before download" screen.

### GET /reports/:id/download

Streams the file with `Content-Type` set per `fileType` and
`Content-Disposition: attachment`.

### DELETE /reports/:id

Deletes the DB row and the underlying file on disk.

---

## 4. Report Content

Every generated report (regardless of `reportType` or `fileType`)
includes:

- **Farm Details** — name, crop, area, location, coordinates
- **Current Weather** — from `weatherService.getCurrent` (cache-first)
- **Forecast** — from `weatherService.getDaily` (cache-first)
- **AI Recommendation** — latest row from `aiService.getLatest`
  (summary, disease risk, irrigation advice, harvest advice, alerts)
- **Satellite Summary** — NDVI metadata from `satelliteService.getMetadata`
- **Sensor Snapshot** — carried on the latest AI recommendation row
  (no dedicated sensor module exists yet — same source the AI module
  itself uses)
- **Generated Time**

Weather is treated as **mandatory** — a fetch failure fails the whole
generation. Satellite, AI recommendation, and sensor data are
**optional** — a missing/failed fetch degrades to an explicit
"Not available" section rather than failing the report, mirroring how
`ai.service.js` already treats satellite data as optional.

---

## 5. Generation Flow

```
1. Ownership check      farmRepository.findByIdForUser(farmId, userId)
2. Data aggregation      reportDataAggregator.gather() — weather (required),
                          satellite + AI + sensor (optional, degrade gracefully)
3. Content hashing       sha256 over farm+weather+satellite+AI-id+sensor
                          (excludes timestamps, so identical data always
                          hashes the same regardless of when it's requested)
4. Dedup check           skip regeneration if a completed report with the
                          same hash still has its file on disk
5. File generation       pdfGenerator | csvGenerator | JSON.stringify
6. Storage               fileStorage.save() → storage/reports/<farmId>/<reportId>.<ext>
7. Persistence           reportsRepository.create()
```

## 6. PDF Flow

`pdfGenerator.js` uses **PDFKit** to stream a document entirely in
memory (no temp files): a section per data category (Farm, Weather,
Forecast, AI Recommendation, Satellite, Sensor), each with a heading rule
and key/value rows. The stream's `data`/`end` events are collected into a
single `Buffer`, which `reports.service.js` hands to `fileStorage.save()`.
PDFKit was chosen over `pdf-lib` because this is document *composition*
from data, not editing an existing PDF.

## 7. CSV Flow

`csvGenerator.js` is a small, dependency-free CSV writer (proper
comma/quote/newline escaping per RFC 4180) producing a "Field, Value"
table per section, plus a wide table for the multi-day forecast array.
No `csv-writer` dependency was added since the report shape doesn't need
a full tabular-writer library.

## 8. JSON Flow

The raw aggregated snapshot (the exact object `reportDataAggregator.gather()`
returns, plus `contentHash`) is serialized with `JSON.stringify(snapshot, null, 2)`
and stored as-is — this is also what's embedded in `metadata` on the DB row
and surfaced via `GET /reports/:id`'s `data` field.

---

## 9. Business Rules

- **Ownership**: every repository query filters on `generated_by`
  (mirrors `farmRepository`'s `userId` filtering) — a user can never
  read/download/delete another user's report, even by guessing a UUID.
- **Dedup**: `forceRegenerate: false` (default) skips regeneration when
  an identical report already exists and its file is still present on
  disk. Set `forceRegenerate: true` to always produce a new file.
- **Metadata is always stored**, even on failure (`status: "failed"`,
  `metadata.error` holds the reason) — a generation attempt is never
  silently dropped.

---

## 10. Security

- Every route requires a valid JWT via the existing `requireAuth`
  middleware.
- Farm ownership is re-verified on every generate call; report ownership
  is re-verified on every get/download/delete call — never trusted from a
  prior request in the same session.
- Files are never served via static middleware. `GET /:id/download`
  resolves the DB row's stored relative path through
  `fileStorage.resolveAbsolutePath()`, which rejects any resolved path
  that falls outside `storage/reports/` as defense-in-depth, even though
  the path always originates from `fileStorage.save()`'s own output (never
  from client input).
- `express.json({ limit: "10kb" })` (already global in `app.js`) caps
  request body size; report payload sizes are entirely server-generated,
  not client-supplied.

---

## 11. Error Handling

| Situation | Behavior |
|---|---|
| Farm doesn't exist / isn't owned by caller | `404 Not Found` before any generation work starts |
| Invalid `reportType` / `fileType` | `400 Bad Request` from `reports.validator.js`, no DB or generation work runs |
| Weather fetch fails during aggregation | `500`-class `ApiError` (via `error.isOperational` passthrough) — generation aborts, nothing is written |
| PDF/CSV generation or file write fails | A `failed` row is recorded (`metadata.error`) for auditability, then a friendly `500` is returned |
| Report file missing on disk (e.g. manually deleted) | Dedup check ignores stale rows; `GET /:id/download` returns `404` prompting regeneration |
| Report not found / not owned | `404 Not Found` on get/download/delete |

**Retry strategy**: retries are client-driven — re-send the same
`POST /reports/generate` request. No server-side cleanup is needed
between attempts since a failed attempt never leaves an orphaned file
(`fileStorage.save()` only "completes" after a full successful write, and
the DB insert happens only after that).

---

## 12. Testing

```bash
npm test
```

Runs Node's built-in test runner (`node --test tests/`) — no new test
framework dependency was added.

- **`tests/unit/reports.generators.test.js`** — pure-function tests for
  `csvGenerator`, `pdfGenerator`, and `reportDataAggregator.computeContentHash`.
  No database required.
- **`tests/unit/fileStorage.test.js`** — filesystem save/exists/delete and
  path-escape rejection. No database required.
- **`tests/integration/reports.api.test.js`** — full HTTP tests against
  the real Express app and a real Postgres database: auth enforcement,
  validation errors, generate → dedup → force-regenerate, list, get,
  download, cross-user access denial, delete.

  **Setup for integration tests:** point `DATABASE_URL` (in `.env`) at a
  disposable Postgres database with migrations applied
  (`npm run db:migrate`), then run `npm test`. The suite seeds and tears
  down its own throwaway user + farm rows.

- **Postman collection**: `docs/AgriCast-Reports.postman_collection.json`
  — every endpoint plus common error cases (invalid `reportType`,
  unowned farm, missing auth token).

---

## 13. Troubleshooting

| Symptom | Likely cause | Fix |
|---|---|---|
| `404 Farm not found` on generate | Farm belongs to another user, or is soft-deleted | Confirm `farmId` and that the farm hasn't been deleted |
| `500` with "Weather data is temporarily unavailable" | Open-Meteo provider outage | Retry; this mirrors the same failure mode `weather.service.js` already has |
| Satellite/AI/Sensor sections show "Not available" | No Sentinel Hub credentials configured, or no AI recommendation has been generated yet for this farm | Expected/graceful — generate an AI recommendation first via `POST /ai/recommend` if you need that section populated |
| `GET /:id/download` returns `404` after a successful generate | The file was manually removed from `storage/reports/` | Regenerate with `forceRegenerate: true` |
| Duplicate-looking reports keep getting created | Underlying weather/AI/satellite data actually changed between requests (the hash is content-based, not time-based) | Expected behavior — pass `forceRegenerate: false` to rely on dedup only when data is genuinely unchanged |
| Migration `0005_reports_module.sql` fails to apply | `0000`–`0004` haven't been applied yet on this database | Run `npm run db:migrate` from a clean/prior state; migrations apply in journal order |

---

## 14. Future Improvements

- Move file storage to S3/GCS for multi-instance deployments (today's
  local-disk storage assumes a single server instance/persistent volume).
- Add a scheduled job to auto-generate `weekly`/`monthly` reports rather
  than requiring an explicit `POST /generate` call.
- Add report expiry/retention policy (auto-delete reports older than N
  days) to bound `storage/reports/` growth.
- Add a `sensors` module with its own time-series table once real sensor
  hardware integration exists, instead of borrowing the AI module's
  `sensorSnapshot`.
- Localize PDF/CSV output using the same `language` field already
  supported by the AI recommendation (`en` / `hi` / `mr`).
- Add signed, time-limited download URLs if reports ever need to be
  shared outside an authenticated session (e.g. emailing a report link).
