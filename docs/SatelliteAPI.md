# Satellite Module — API Documentation

All satellite endpoints are mounted at `/api/v1/satellite/` and require a valid JWT (`Authorization: Bearer <token>`).

---

## Endpoints

### GET `/layers`
Returns the static list of supported imagery layers.

**Auth:** Required  
**Response:**
```json
{
  "success": true,
  "data": {
    "count": 5,
    "layers": [
      { "id": "TRUE_COLOR", "label": "True Color", "description": "Natural-color image." },
      { "id": "NDVI", "label": "NDVI (Vegetation Index)", "description": "Vegetation health index." },
      { "id": "FALSE_COLOR", "label": "False Color", "description": "NIR composite." },
      { "id": "MOISTURE_INDEX", "label": "Moisture Index", "description": "Canopy/soil moisture." },
      { "id": "EVI", "label": "Enhanced Vegetation Index", "description": "Dense canopy index." }
    ]
  }
}
```

---

### GET `/current/:farmId`
**Primary endpoint.** Combined response: TRUE_COLOR image + scene metadata + computed health metrics.

**Auth:** Required  
**Params:** `farmId` (UUID)  
**Query:**
| Param | Type | Default | Description |
|-------|------|---------|-------------|
| `layer` | string | `TRUE_COLOR` | One of the supported layers |
| `startDate` | YYYY-MM-DD | -30 days | Start of imagery search window |
| `endDate` | YYYY-MM-DD | today | End of imagery search window |

**Response:**
```json
{
  "success": true,
  "data": {
    "farmId": "uuid",
    "image": {
      "layer": "TRUE_COLOR",
      "mimeType": "image/png",
      "imageBase64": "...",
      "sizeBytes": 204800,
      "dateRange": { "from": "2026-07-01", "to": "2026-08-05" },
      "bbox": [73.8, 18.5, 73.9, 18.6],
      "cache": { "hit": true, "expiresAt": "2026-08-05T18:00:00Z" }
    },
    "metadata": {
      "sceneCount": 4,
      "scenes": [
        { "sceneId": "S2A_...", "capturedAt": "2026-08-03T06:12:00Z", "cloudCoverPercent": 12 }
      ],
      "latestCapture": "2026-08-03T06:12:00Z",
      "avgCloudCover": 18
    },
    "health": {
      "score": 78,
      "grade": "B",
      "description": "Good",
      "assessment": {
        "summary": "Vegetation: Moderate Vegetation. Moisture: Moderate Moisture.",
        "recommendations": ["Conditions appear normal. Continue monitoring weekly."]
      }
    }
  }
}
```

---

### GET `/ndvi/:farmId`
Fetches the NDVI layer image. Shorthand for `/image/:farmId?layer=NDVI`.

**Auth:** Required  
**Params / Query:** Same as `/current` (no `layer` param — always NDVI)  
**Response:** Same shape as `image` block inside `/current`

---

### GET `/health/:farmId`
Returns computed vegetation health score and crop assessment without returning an image.

**Auth:** Required  
**Response:**
```json
{
  "success": true,
  "data": {
    "farmId": "uuid",
    "health": {
      "score": 72,
      "grade": "B",
      "description": "Good",
      "assessment": {
        "summary": "Vegetation: Healthy Vegetation. Moisture: Moderate Moisture.",
        "recommendations": ["Dense, healthy vegetation detected. Maintain current practices."]
      }
    },
    "sceneCount": 4,
    "latestCapture": "2026-08-03T06:12:00Z",
    "avgCloudCover": 18
  }
}
```

---

### GET `/history/:farmId`
Returns scene metadata list (capture dates, cloud cover) for a date range.

**Auth:** Required  
**Query:** `startDate`, `endDate`, `layer` (optional)  
**Response:**
```json
{
  "success": true,
  "data": {
    "farmId": "uuid",
    "layer": "TRUE_COLOR",
    "sceneCount": 8,
    "scenes": [
      { "sceneId": "S2A_...", "capturedAt": "2026-08-03T06:12:00Z", "cloudCoverPercent": 12 },
      { "sceneId": "S2B_...", "capturedAt": "2026-07-28T06:30:00Z", "cloudCoverPercent": 35 }
    ],
    "avgCloudCover": 20,
    "latestCapture": "2026-08-03T06:12:00Z"
  }
}
```

---

### GET `/timelapse/:farmId`
Returns satellite images for three preset periods: last week, last month, last season.

**Auth:** Required  
**Query:** `layer` (optional, default `TRUE_COLOR`)  
**Response:**
```json
{
  "success": true,
  "data": {
    "farmId": "uuid",
    "frameCount": 3,
    "frames": [
      {
        "label": "Last Week",
        "period": "week",
        "dateRange": { "from": "2026-07-29", "to": "2026-08-05" },
        "layer": "TRUE_COLOR",
        "mimeType": "image/png",
        "imageBase64": "...",
        "sizeBytes": 180000
      }
    ]
  }
}
```

---

### GET `/image/:farmId` *(legacy)*
Low-level: fetch a single image for any layer and date range.

### GET `/metadata/:farmId` *(legacy)*
Low-level: fetch scene metadata only.

---

### POST `/refresh/:farmId`
Clears all cached satellite data for a farm and triggers fresh imagery on next request.

**Auth:** Required  
**Response:**
```json
{
  "success": true,
  "data": {
    "farmId": "uuid",
    "invalidatedRows": 3,
    "refreshedAt": "2026-08-05T10:00:00Z",
    "message": "Cache cleared (3 entries). New imagery will be fetched on next request."
  }
}
```

---

## Error Codes

| Code | Meaning |
|------|---------|
| 400 | Validation failed (invalid farmId, unsupported layer, bad date format) |
| 401 | Missing or expired JWT |
| 403 | Farm does not belong to current user |
| 404 | Farm not found |
| 503 | Sentinel Hub temporarily unavailable |
| 500 | Internal error |
