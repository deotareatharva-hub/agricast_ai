# AgriCast AI — AI Recommendation Module Guide

## 1. Module Overview

### Goal

Give every farm an AI decision engine: it pulls together weather, farm,
crop, satellite, sensor, and language inputs, builds a structured prompt,
calls the **Grok API**, validates the response against a strict contract,
stores every recommendation permanently, and returns clean structured
JSON to the frontend. The frontend never talks to Grok directly and never
sees a Grok API key.

### What was built

- One new table: `recommendations` — append-only, one row per generated
  recommendation, holding the exact weather/satellite/sensor snapshot the
  prompt was built from, the full prompt, the raw provider response, and
  the validated parsed response.
- An `integrations/ai/` layer that is the only code in the repo that
  knows Grok's request/response wire shape or holds a Grok API key.
- A `modules/ai/` module following the exact `routes → controller →
  service → repository` layering of `modules/weather/` and
  `modules/satellite/`.
- Reuse (not duplication) of `weatherService` and `satelliteService` to
  gather the current recommendation's inputs — no new HTTP client for
  weather/satellite data, no bypassing their existing caching.

### What was intentionally NOT changed

`auth`, `farms`, `weather`, `satellite`, middlewares, `ApiError`,
`ApiResponse`, `asyncHandler`, `logger`, `jwtUtil`, `db.js` — all
untouched. Three existing files were *extended*, never rewritten:
`db/schema/index.js`, `routes/index.js`, `config/env.js` (see §7), plus
`.env.example` (added Grok config). `package.json` did **not** need to
change — `axios` is already a dependency (added for the weather module).

---

## 2. Folder Structure (new/changed only)

```
backend/src/
├── db/
│   ├── schema/
│   │   ├── recommendations.schema.js  # NEW — recommendations table
│   │   └── index.js                    # CHANGED — re-exports recommendations
│   └── migrations/
│       ├── 0004_ai_module.sql          # NEW
│       └── meta/
│           ├── 0004_snapshot.json      # NEW
│           └── _journal.json           # CHANGED — registers migration 0004
├── integrations/
│   └── ai/                             # NEW — external API layer
│       ├── grok.js                     # Grok chat-completions client (axios, retry, timeout)
│       ├── promptBuilder.js            # system/developer/user prompt construction
│       ├── responseParser.js           # raw string → JSON, rejects malformed output
│       └── recommendationValidator.js  # enforces the recommendation contract
├── modules/
│   └── ai/                             # NEW module
│       ├── ai.routes.js
│       ├── ai.controller.js
│       ├── ai.service.js
│       ├── ai.repository.js
│       ├── ai.validator.js
│       └── ai.schema.js                # response DTO shaping (frontend-facing shape)
├── config/env.js                       # CHANGED — added env.ai.grok.*
└── routes/index.js                     # CHANGED — mounts /ai
```

`ai.schema.js` (DTO shaping, in `modules/ai/`) is deliberately separate
from `db/schema/recommendations.schema.js` (the Drizzle table
definition) — same naming convention as the weather and satellite
modules.

---

## 3. Prompt Flow

```
Farm + Crop (farms table)
Weather      → weatherService.getCurrent() + getDaily()  (cache-first, reused as-is)
Satellite    → satelliteService.getMetadata(layer: NDVI) (optional — degrades to null on failure)
Sensor       → passed in the request body (no sensor module exists yet)
Language     → request body, defaults to "en"
        ↓
promptBuilder.build({ farm, crop, weather, satellite, sensor, language })
        ↓  produces three separate messages sent to Grok:
   systemPrompt     — fixed agronomist persona, doesn't change per request
   developerPrompt  — the strict JSON output contract + language instruction
   userPrompt       — the actual farm/weather/satellite/sensor data, labeled sections
        ↓
grokClient.generateCompletion(...)  → raw string (Grok's message content)
        ↓
responseParser.parse(rawString)     → plain JS object, throws on malformed JSON
        ↓
recommendationValidator.validate(parsed) → throws unless summary, irrigation,
                                            harvest, diseaseRisk, and a
                                            top-level confidence are all present
        ↓
aiRepository.create({...})          → INSERT into recommendations (never UPDATE)
        ↓
aiSchema.toRecommendationDto(row)   → returned to the caller
```

Weather is a **required** input (`weather_snapshot` is `NOT NULL`), so a
weather-fetch failure fails the whole `/recommend` call. Satellite is
**optional** (`satellite_snapshot` is nullable) — if Sentinel Hub
credentials are missing or the call fails, the engine logs a warning and
continues without it; the prompt explicitly instructs Grok to reason
around a missing satellite section rather than invent values.

---

## 4. Database

### `recommendations`

| Column               | Type                     | Notes                                            |
|----------------------|--------------------------|---------------------------------------------------|
| `id`                 | uuid (PK)                | `gen_random_uuid()`                                |
| `farm_id`            | uuid (FK → farms, cascade)| every recommendation belongs to exactly one farm  |
| `weather_snapshot`   | jsonb, NOT NULL          | exact current + daily forecast used               |
| `satellite_snapshot` | jsonb, nullable          | NDVI metadata used, or `null`                     |
| `sensor_snapshot`    | jsonb, nullable          | caller-supplied, or `null`                        |
| `prompt`             | text, NOT NULL           | full system+developer+user prompt, concatenated   |
| `raw_response`       | text, NOT NULL           | untouched Grok response string                    |
| `parsed_response`    | jsonb, NOT NULL          | validated strict-JSON recommendation              |
| `language`           | varchar(5), NOT NULL     | `en` \| `hi` \| `mr`, checked at the DB level      |
| `confidence`         | numeric(5,2), NOT NULL   | 0–100, checked at the DB level                    |
| `created_at`         | timestamptz, NOT NULL    | defaults to `now()`                               |

Indexes: `farm_id` (every query is farm-scoped) and `created_at`
(history/latest ordering). No unique constraint on `farm_id` — a farm
can and will have many recommendation rows; **rows are never updated,
only inserted**, so history is permanent by construction (`ai.repository.js`
exposes no update/delete method at all).

> The migration SQL (`0004_ai_module.sql`) was hand-authored to match
> `drizzle-kit`'s exact output style (see `0003_satellite_module.sql` for
> the precedent), since this environment couldn't run `drizzle-kit
> generate` directly (no installed `node_modules` / no network). Before
> running this against a real database, run `npm run db:generate` once
> to let `drizzle-kit` confirm the migration against your local schema
> state and regenerate `meta/0004_snapshot.json` if anything differs.

---

## 5. API Documentation

All routes require `Authorization: Bearer <token>` (via `requireAuth`,
same as every other module) and are scoped to farms the authenticated
user owns.

### `POST /api/v1/ai/recommend`

Body:
```json
{
  "farmId": "uuid",
  "language": "en",
  "sensorSnapshot": { "soilMoisture": 34, "soilTemp": 21 }
}
```
`language` optional (defaults to `en`, must be `en`/`hi`/`mr`).
`sensorSnapshot` optional, any JSON object.

Response `201`:
```json
{
  "success": true,
  "message": "AI recommendation generated successfully",
  "data": {
    "id": "uuid",
    "farmId": "uuid",
    "language": "en",
    "confidence": 92,
    "createdAt": "2026-08-04T10:00:00.000Z",
    "summary": "...",
    "irrigation": { "action": "Irrigate", "reason": "...", "confidence": 92 },
    "harvest": { "action": "...", "reason": "..." },
    "diseaseRisk": { "level": "Low", "reason": "..." },
    "alerts": [],
    "nextReview": "2026-08-07"
  }
}
```

### `GET /api/v1/ai/history/:farmId?limit=&offset=`

`limit` (1–100, default 20), `offset` (default 0). Returns a lightweight
list (id, language, confidence, createdAt, summary, diseaseRisk) —
not the full parsed response, to keep the payload small for a history
list view.

### `GET /api/v1/ai/latest/:farmId`

Returns the single most recent recommendation in full (same shape as
the `POST /recommend` response's `data`), or `{ "recommendation": null }`
if none exists yet.

---

## 6. Prompt Engineering

Three separate messages are sent to Grok rather than one blob, so each
concern can be revised independently (see `integrations/ai/promptBuilder.js`):

- **System prompt** — fixed agronomist persona. Cheapest part of the
  prompt to keep stable if Grok ever adds prompt caching.
- **Developer prompt** — the non-negotiable strict-JSON output contract
  and the language instruction (write free-text values in the requested
  language; JSON keys and `diseaseRisk.level` always stay in English so
  they remain machine-readable regardless of language).
- **User prompt** — the actual farm/weather/satellite/sensor data for
  this request, as labeled sections (not a raw JSON dump) — this reads
  far better to the model and is exactly what gets persisted to
  `recommendations.prompt` for later inspection.

Supported languages: **English (`en`)**, **Hindi (`hi`)**, **Marathi
(`mr`)** — enforced both by `RECOMMENDATION_LANGUAGES` in the DB schema
and `ai.validator.js`'s request validation.

---

## 7. Response Validation

Two separate steps, two separate files, deliberately not merged:

1. **`responseParser.js`** — "is this even valid JSON?" Strips
   accidental ` ```json ` code fences, `JSON.parse`s the result, and
   throws a clear `ApiError` if parsing fails or the result isn't a
   plain object.
2. **`recommendationValidator.js`** — "does this JSON satisfy the
   recommendation contract?" Requires `summary`, `irrigation.action`,
   `irrigation.reason`, `harvest.action`, `harvest.reason`,
   `diseaseRisk.level` (must be `Low`/`Medium`/`High`),
   `diseaseRisk.reason`, and a top-level `confidence` (0–100).
   `alerts`/`nextReview` are normalized with safe defaults rather than
   rejected outright if missing, since their absence doesn't undermine
   the recommendation itself.

Any failure at either step throws `ApiError.internal(...)` — the
request never reaches `aiRepository.create()`, so a malformed AI
response is never persisted as if it were valid history.

---

## 8. Error Handling

| Failure                          | Behavior                                                    |
|-----------------------------------|--------------------------------------------------------------|
| Missing `GROK_API_KEY`           | `ApiError.internal` — clear message, doesn't crash the server at boot (same convention as missing Sentinel Hub credentials) |
| Grok timeout / network error     | Retried (linear backoff) up to `GROK_MAX_RETRIES`, then `ApiError.internal` |
| Grok 429 (rate limit)            | Treated as transient — retried same as timeouts               |
| Grok 4xx (bad request)           | Not retried — fails fast, logged                               |
| Malformed / non-JSON response    | `responseParser.js` throws, nothing is persisted               |
| Response missing required fields | `recommendationValidator.js` throws, nothing is persisted       |
| Weather fetch failure            | Fatal — weather is a required input                            |
| Satellite fetch failure          | Non-fatal — recommendation continues with `satelliteSnapshot: null` |

---

## 9. Security

- `GROK_API_KEY` is read only inside `integrations/ai/grok.js` and is
  never logged, never returned in any response, and never passed to the
  frontend.
- Every route requires `requireAuth`; every service method takes
  `userId` first and calls `farmRepository.findByIdForUser` before
  touching any farm's data — a user can never generate or read
  recommendations for a farm they don't own.
- Request bodies are validated with `express-validator` chains
  (`ai.validator.js`) before anything reaches the service layer.

---

## 10. Performance

- Weather inputs are fetched via `weatherService` (not a fresh Open-Meteo
  call), so an existing warm cache is reused automatically — this alone
  satisfies "reuse weather snapshots, limit unnecessary calls."
- Satellite inputs use `satelliteService.getMetadata` (metadata only, not
  a full image fetch) since only scene/vegetation-index data is needed
  for the prompt, not imagery.
- The full assembled prompt is persisted per recommendation
  (`recommendations.prompt`), so re-running analytics or debugging a past
  recommendation never requires rebuilding it from scratch.

---

## 11. Testing

### Unit Test Plan
- `promptBuilder.build()` — produces all three prompt strings; language
  name substitution for `en`/`hi`/`mr`; handles `satellite: null` /
  `sensor: null` gracefully.
- `responseParser.parse()` — valid JSON passes through; ` ```json `-fenced
  JSON is stripped and parsed; non-JSON string throws; JSON array/
  primitive (not an object) throws.
- `recommendationValidator.validate()` — passes a fully-valid payload
  unchanged; throws on each individually-missing required field
  (`summary`, `irrigation.action`, `irrigation.reason`, `harvest.action`,
  `harvest.reason`, `diseaseRisk.level` with an invalid value,
  `diseaseRisk.reason`, missing/out-of-range `confidence`); defaults
  `alerts` to `[]` and `nextReview` to `null` when absent rather than
  throwing.
- `grokClient.generateCompletion()` — throws immediately if
  `GROK_API_KEY` is unset; retries on timeout/5xx/429; does not retry on
  a non-429 4xx.

### Integration Test Plan
- `POST /recommend` with a farm the user doesn't own → `404`.
- `POST /recommend` with no `farmId` → `400` (validation).
- `POST /recommend` happy path (mock Grok) → `201`, row present in
  `recommendations`, `confidence` matches the parsed response.
- `POST /recommend` with Grok returning malformed JSON (mocked) → `500`,
  **no row inserted**.
- `GET /history/:farmId` → paginated, newest first, respects
  `limit`/`offset`.
- `GET /latest/:farmId` with no recommendations yet →
  `{ "recommendation": null }`, `200` (not a `404`).
- Repeated `POST /recommend` calls for the same farm → each becomes its
  own row; no existing row is ever updated.

### Postman Examples

**Generate a recommendation**
```
POST {{baseUrl}}/api/v1/ai/recommend
Authorization: Bearer {{token}}
Content-Type: application/json

{
  "farmId": "{{farmId}}",
  "language": "hi"
}
```

**History**
```
GET {{baseUrl}}/api/v1/ai/history/{{farmId}}?limit=10&offset=0
Authorization: Bearer {{token}}
```

**Latest**
```
GET {{baseUrl}}/api/v1/ai/latest/{{farmId}}
Authorization: Bearer {{token}}
```

---

## 12. Future Improvements

- A dedicated sensor-ingestion module (currently `sensorSnapshot` is
  accepted as free-form JSON straight from the request body with no
  storage/history of its own).
- Prompt-level caching for identical (farm, weather-hash, satellite-hash)
  inputs within a short window, to avoid a duplicate Grok call if a
  farmer double-submits.
- Analytics endpoints over `recommendations` (e.g. confidence trend per
  farm, disease-risk trend over a season) — the append-only design of
  this table was chosen specifically to make that possible later without
  a schema change.
- Streaming responses from Grok for a faster perceived response time on
  the frontend.
