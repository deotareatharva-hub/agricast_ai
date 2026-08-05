# Satellite Provider Guide

This document explains how to add a new satellite imagery provider to AgriCast AI without touching controllers or services.

---

## Provider Interface

All providers extend `SatelliteProvider` from `src/modules/satellite/providers/provider.interface.js`.

```js
import { SatelliteProvider } from "./provider.interface.js";

export class MyProvider extends SatelliteProvider {
  get name() { return "My Provider Name"; }
  get supportedLayers() { return ["TRUE_COLOR", "NDVI"]; }

  async fetchImage({ bbox, dateRange, layer }) {
    // bbox: [west, south, east, north]
    // dateRange: { from: "YYYY-MM-DD", to: "YYYY-MM-DD" }
    // Return: { layer, bbox, dateRange, mimeType, imageBase64, sizeBytes }
  }

  async fetchMetadata({ bbox, dateRange }) {
    // Return: { layer, bbox, dateRange, sceneCount, scenes[] }
    // Each scene: { sceneId, capturedAt, cloudCoverPercent }
  }

  async ping() { return true; }
}
```

---

## Currently Implemented: Sentinel Hub

**File:** `providers/sentinel.provider.js`  
**Underlying client:** `integrations/satellite/sentinel.js`  
**Auth:** OAuth2 client credentials (token managed by `tokenManager.js`)  
**Supported layers:** `TRUE_COLOR`, `FALSE_COLOR`, `NDVI`, `MOISTURE_INDEX`, `EVI`

---

## Adding: Google Earth Engine

```js
// providers/gee.provider.js
import { SatelliteProvider } from "./provider.interface.js";
import { GoogleAuth } from "google-auth-library";

export class GeeProvider extends SatelliteProvider {
  get name() { return "Google Earth Engine"; }
  get supportedLayers() { return ["TRUE_COLOR", "NDVI"]; }

  async fetchImage({ bbox, dateRange, layer }) {
    // Use Earth Engine REST API or ee.js
    // Map `layer` to an EE script
    // Return normalized shape (same as SentinelProvider)
  }

  async fetchMetadata({ bbox, dateRange }) {
    // Query EE metadata catalog
  }
}
```

---

## Adding: NASA EarthData (MODIS/Landsat)

```js
// providers/nasa.provider.js
// Use NASA CMR API: https://cmr.earthdata.nasa.gov/search/
// Products: MODIS Terra MOD09GA (true color) or MOD13A1 (NDVI)
// Auth: Earthdata Login (username/password) or EDL tokens
```

---

## Adding: Planet Labs

```js
// providers/planet.provider.js
// Use Planet Orders API v2: https://api.planet.com/compute/ops/
// Auth: API key header (X-API-Key)
// Note: Planet imagery requires a subscription with AOI-based quota
```

---

## Adding: Mapbox Raster

```js
// providers/mapbox.provider.js
// Use Mapbox Raster Tiles API or Isochrone for visual tiles
// Auth: access_token query param
// Best for true-color tiles; limited spectral index support
```

---

## Adding: Copernicus (DIAS / WCS)

```js
// providers/copernicus.provider.js
// WCS endpoint: https://services.sentinel-hub.com/ogc/wcs/{instanceId}
// Same Sentinel Hub OAuth2 credentials, different endpoint format
// Useful for WCS GetCoverage requests returning GeoTIFF
```

---

## Registering a Provider in the Service

Once implemented, register your provider in `satellite.service.js`:

```js
import { sentinelProvider } from "./providers/sentinel.provider.js";
import { GeeProvider } from "./providers/gee.provider.js";

// Provider registry — controlled by config/feature flag
const PROVIDERS = {
  sentinel: sentinelProvider,
  gee: new GeeProvider(),
};

function getActiveProvider() {
  const name = env.satellite.provider ?? "sentinel";
  return PROVIDERS[name] ?? sentinelProvider;
}
```

Then replace all `sentinelClient.fetchImage()` calls with `getActiveProvider().fetchImage()`.

---

## Provider Comparison

| Provider | Free Tier | Resolution | Latency | Best For |
|----------|-----------|-----------|---------|----------|
| Sentinel Hub | Trial (25 req/month) | 10m | 2-8s | Production NDVI, multispectral |
| Google Earth Engine | Free (non-commercial) | 10-30m | 5-30s | Research, time series |
| NASA EarthData | Free | 250m-30m | 1-5s | MODIS daily, Landsat archival |
| Planet Labs | Paid | 3-5m | 1-3s | High-res commercial |
| Mapbox Raster | Free tier | variable | <1s | Basemap tiles only |
| Copernicus WCS | Same as Sentinel Hub | 10m | 2-8s | GeoTIFF output |
