# Satellite Module — Architecture

## Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                        FRONTEND                                  │
│  SatellitePage                                                   │
│    ├── useSatelliteCurrent()   → GET /current/:farmId            │
│    ├── useSatelliteNdvi()      → GET /ndvi/:farmId               │
│    ├── useSatelliteHealth()    → GET /health/:farmId             │
│    ├── useSatelliteHistory()   → GET /history/:farmId            │
│    ├── useSatelliteTimelapse() → GET /timelapse/:farmId          │
│    └── useRefreshSatellite()   → POST /refresh/:farmId           │
└──────────────────────────────┬──────────────────────────────────┘
                               │ HTTP/JSON (JWT)
┌──────────────────────────────▼──────────────────────────────────┐
│                        BACKEND                                   │
│                                                                  │
│  satellite.routes.js                                             │
│    └── satellite.controller.js (thin — validate + shape DTOs)   │
│          └── satellite.service.js (business logic)              │
│                ├── satellite.repository.js (DB queries)         │
│                ├── cache.service.js (TTL, invalidation)         │
│                ├── indexCalculator.js (health scores, NDVI)     │
│                ├── imageProcessor.js (base64, color maps)       │
│                └── SentinelProvider (provider interface)        │
│                      └── sentinelClient (HTTP → Sentinel Hub)   │
│                            └── tokenManager (OAuth2)            │
└──────────────────────────────────────────────────────────────────┘

Database (PostgreSQL + Drizzle):
  satellite_cache      — image + metadata cache (per farmId/layer/paramsHash)
  satellite_requests   — append-only audit log
```

---

## Provider Abstraction

Every imagery provider must implement the `SatelliteProvider` interface:

```js
class SatelliteProvider {
  get name()              // Human-readable name
  get supportedLayers()  // string[]
  async fetchImage(params)    // → { imageBase64, mimeType, sizeBytes, ... }
  async fetchMetadata(params) // → { sceneCount, scenes[] }
  async ping()           // → boolean
}
```

Currently: `SentinelProvider` (wraps Sentinel Hub).

**Adding a new provider (e.g. Google Earth Engine):**
1. Create `providers/gee.provider.js` extending `SatelliteProvider`.
2. Register it in `satellite.service.js` via a config flag — **no controller changes needed**.

---

## Cache Strategy

| Scenario | Cache Action |
|----------|-------------|
| Same farm + layer + bbox + date range within TTL | Return cached base64 image |
| Manual `POST /refresh/:farmId` | Delete ALL entries for that farm |
| TTL expired | Re-fetch from Sentinel Hub, upsert cache |
| New satellite pass available | Detected by date range change → cache miss |

Default TTL: **6 hours** (configurable via `cache.service.js`).

Cache key = `(farmId, layer, SHA-256(layer + bbox + dateRange)[:16])`.

---

## Data Flow: `GET /current/:farmId`

```
1. Controller validates farmId + query params
2. Service checks farm ownership (farmRepository.findByIdForUser)
3. Service calls getImage() and getMetadata() concurrently (Promise.allSettled)
4. getImage():
   a. Compute bbox from farm coordinates (5km buffer by default)
   b. Hash params → check satellite_cache
   c. Cache hit + fresh → return cached base64
   d. Cache miss → sentinelClient.fetchImage() → upsert cache → return
5. getMetadata():
   a. Same bbox / date range
   b. sentinelClient.fetchMetadata() (catalog search)
   c. sentinelMapper.mapMetadata() → scenes[]
6. computeHealthScore({ sceneCount, scenes }) → 0-100 score
7. assessCropHealth({ cloudCoverPercent, ndvi, ndwi }) → summary + recommendations
8. satelliteSchema.toCurrentDto() → JSON response
```

---

## Health Score Algorithm

```
score = sceneAvailability(0-40) + cloudQuality(0-40) + ndviContribution(0-20)

sceneAvailability = min(sceneCount / 5, 1) * 40
cloudQuality      = ((100 - avgCloudCover) / 100) * 40
ndviContribution  = min(ndvi / 0.8, 1) * 20  (when available)

Grade: A ≥ 85 | B ≥ 70 | C ≥ 55 | D ≥ 40 | F < 40
```

---

## Frontend Architecture

```
src/features/satellite/
  api/
    satellite.api.js          ← axios calls, one function per endpoint
  hooks/
    satelliteKeys.js          ← TanStack Query key factory
    useSatelliteCurrent.js    ← primary hook (image + metadata + health)
    useSatelliteNdvi.js
    useSatelliteHealth.js
    useSatelliteHistory.js
    useSatelliteTimelapse.js
    useSatelliteLayers.js
    useRefreshSatellite.js    ← mutation hook
  utils/
    ndviColorMap.js           ← NDVI classes, colour ramp, grade colours
    satelliteFormatters.js    ← date, size, cloud cover formatters
  components/
    SatelliteHero.jsx         ← hero banner with health grade
    SatelliteMap.jsx          ← Leaflet map + satellite image overlay
    LayerSelector.jsx         ← layer toggle buttons
    NDVICard.jsx              ← NDVI image + colour ramp
    HealthScoreCard.jsx       ← circular score gauge
    VegetationHealthCard.jsx  ← crop assessment + recommendations
    CloudCoverageCard.jsx     ← cloud cover + scene list
    SatelliteStatistics.jsx   ← 4-stat quick-look row
    SatelliteLegend.jsx       ← NDVI colour legend
    FarmBoundaryOverlay.jsx   ← bbox coordinates display
    SatelliteTimeline.jsx     ← tabbed timelapse frames
    ImageComparisonSlider.jsx ← drag before/after slider
    SatelliteHistory.jsx      ← scene history with date presets
    RefreshSatelliteButton.jsx
    SatelliteLoading.jsx      ← skeleton loader
    SatelliteError.jsx        ← error state
    EmptySatelliteState.jsx   ← empty state
  pages/
    SatellitePage.jsx         ← 5-tab page: Overview, Map, Analysis, Timeline, History
```
