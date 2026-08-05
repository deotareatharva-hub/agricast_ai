# Satellite Module — Integration Checklist

Use this checklist when deploying or verifying the satellite module end-to-end.

---

## Environment Variables

### Backend `.env`
- [ ] `SENTINEL_CLIENT_ID` — Sentinel Hub OAuth2 client ID
- [ ] `SENTINEL_CLIENT_SECRET` — Sentinel Hub OAuth2 client secret
- [ ] `SENTINEL_TOKEN_URL` — OAuth2 token endpoint (default: `https://services.sentinel-hub.com/oauth/token`)
- [ ] `SENTINEL_PROCESS_URL` — Process API endpoint
- [ ] `SENTINEL_CATALOG_URL` — Catalog API endpoint
- [ ] `SENTINEL_BBOX_BUFFER_METERS` — bounding box buffer around farm center (default: 5000)
- [ ] `DATABASE_URL` — PostgreSQL connection string

### Frontend `.env`
- [ ] `VITE_API_BASE_URL` — backend URL (e.g. `http://localhost:5000/api/v1`)

---

## Database Migrations

- [ ] Migration `0003_satellite_module.sql` applied → `satellite_cache` and `satellite_requests` tables created
- [ ] Verify with: `\d satellite_cache` and `\d satellite_requests` in psql

---

## Sentinel Hub Setup

- [ ] Sentinel Hub account created at [https://apps.sentinel-hub.com](https://apps.sentinel-hub.com)
- [ ] OAuth2 client created with Process API + Catalog API scopes
- [ ] Client ID and secret added to backend `.env`
- [ ] Test token fetch: `POST {SENTINEL_TOKEN_URL}` returns `access_token`
- [ ] Test catalog search returns features for a known bbox + date range

---

## Backend Routes

Verify all routes respond correctly (use Postman or curl):

- [ ] `GET /api/v1/satellite/layers` → 200 with 5 layers
- [ ] `GET /api/v1/satellite/current/:farmId` → 200 with image + metadata + health
- [ ] `GET /api/v1/satellite/ndvi/:farmId` → 200 with NDVI image
- [ ] `GET /api/v1/satellite/health/:farmId` → 200 with health score
- [ ] `GET /api/v1/satellite/history/:farmId` → 200 with scenes array
- [ ] `GET /api/v1/satellite/timelapse/:farmId` → 200 with 3 frames
- [ ] `POST /api/v1/satellite/refresh/:farmId` → 200 confirming cache clear
- [ ] Unauthenticated request → 401
- [ ] Wrong user's farmId → 403 or 404

---

## Frontend Pages

- [ ] `GET /dashboard/satellite` — farm picker appears when no farm selected
- [ ] `GET /dashboard/farms/:farmId/satellite` — shows satellite data for that farm
- [ ] "Satellite" appears in sidebar nav (desktop) and mobile drawer
- [ ] Layer selector works: switching layers triggers a new API call
- [ ] 5 tabs all render: Overview, Map, Analysis, Timeline, History

---

## Component Functionality

- [ ] **SatelliteHero** — shows farm name, health grade, last capture date, cloud cover
- [ ] **SatelliteMap** — Leaflet map renders at farm coordinates; satellite overlay visible when image loaded
- [ ] **NDVICard** — NDVI image renders; color ramp legend visible
- [ ] **HealthScoreCard** — circular gauge animates to health score
- [ ] **VegetationHealthCard** — shows summary and recommendations
- [ ] **CloudCoverageCard** — shows avg cloud cover + up to 5 recent scenes
- [ ] **SatelliteStatistics** — 4-stat row: provider, last capture, cloud cover, image size
- [ ] **SatelliteLegend** — NDVI legend visible when NDVI layer selected
- [ ] **FarmBoundaryOverlay** — shows bbox coords and date range
- [ ] **SatelliteTimeline** — 3 tabs (last week/month/season); images load per tab
- [ ] **ImageComparisonSlider** — drag handle moves; before/after images visible
- [ ] **SatelliteHistory** — date preset picker; scenes listed newest-first
- [ ] **RefreshSatelliteButton** — clears cache and shows success message
- [ ] **SatelliteLoading** — skeleton shows during initial load
- [ ] **SatelliteError** — error card with retry button on API failure
- [ ] **EmptySatelliteState** — shown when no farms exist

---

## i18n

- [ ] English (`en/translation.json`) — `satellite.*` keys present
- [ ] Hindi (`hi/translation.json`) — `satellite.*` keys present
- [ ] Marathi (`mr/translation.json`) — `satellite.*` keys present
- [ ] Language switcher changes all satellite UI text
- [ ] No hardcoded English strings in satellite components

---

## Error Handling

- [ ] No Sentinel Hub credentials → `SatelliteError` shown (not a crash)
- [ ] Network timeout → retry button available
- [ ] Invalid farmId → 404 handled gracefully
- [ ] High cloud cover → shown in CloudCoverageCard with appropriate color
- [ ] Cache cleared → next request fetches fresh imagery
