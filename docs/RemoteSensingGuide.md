# Remote Sensing Guide — AgriCast AI

A practical reference for the GIS concepts used in the Satellite Module.

---

## Spectral Indices

### NDVI — Normalized Difference Vegetation Index

```
NDVI = (NIR - Red) / (NIR + Red)
Range: -1 to +1
```

| Value | Meaning |
|-------|---------|
| < 0 | Water, snow, clouds |
| 0 – 0.1 | Bare soil, rock, urban |
| 0.1 – 0.3 | Sparse or stressed vegetation |
| 0.3 – 0.5 | Moderate, low-density vegetation |
| 0.5 – 0.7 | Dense, healthy crops |
| 0.7 – 1.0 | Very dense / tropical canopy |

**Sentinel-2 bands used:** B8 (NIR, 842nm) and B4 (Red, 665nm)

### NDWI — Normalized Difference Water Index

```
NDWI = (Green - NIR) / (Green + NIR)
Range: -1 to +1
```

| Value | Meaning |
|-------|---------|
| > 0.3 | Open water body |
| 0.1 – 0.3 | Flooded / waterlogged soil |
| -0.1 – 0.1 | Moderate soil moisture |
| < -0.1 | Dry soil / stressed crop |

**Bands:** B3 (Green, 560nm) and B8 (NIR, 842nm)

### EVI — Enhanced Vegetation Index

```
EVI = 2.5 × (NIR - Red) / (NIR + 6×Red - 7.5×Blue + 1)
```

Corrects for atmospheric noise and soil background effects — more accurate than NDVI in dense canopy areas. Uses B2 (Blue), B4 (Red), B8 (NIR).

### Moisture Index

The Moisture Index (SWIR-based) uses shortwave infrared to detect canopy and soil moisture:

```
MI = (NIR - SWIR) / (NIR + SWIR)
```

**Bands:** B8A (NIR narrow, 865nm) and B11 (SWIR, 1610nm)

---

## Sentinel-2 Bands Reference

| Band | Name | Central Wavelength | Resolution |
|------|------|--------------------|------------|
| B2 | Blue | 490 nm | 10m |
| B3 | Green | 560 nm | 10m |
| B4 | Red | 665 nm | 10m |
| B5 | Red Edge 1 | 705 nm | 20m |
| B6 | Red Edge 2 | 740 nm | 20m |
| B7 | Red Edge 3 | 783 nm | 20m |
| B8 | NIR | 842 nm | 10m |
| B8A | NIR narrow | 865 nm | 20m |
| B11 | SWIR 1 | 1610 nm | 20m |
| B12 | SWIR 2 | 2190 nm | 20m |

---

## Cloud Cover

Cloud cover percentage from Sentinel Hub's catalog (`eo:cloud_cover`) represents the fraction of the bounding box covered by clouds. Best practice:

- **< 20%** — acceptable for index calculation
- **20–50%** — marginal quality; indices may be unreliable at edges
- **> 50%** — imagery too cloudy for reliable analysis; wait for next pass

Sentinel-2 revisit time: **5 days** at equator, **2-3 days** at higher latitudes.

---

## Bounding Box Calculation

AgriCast AI derives the bounding box from the farm's center coordinates using a `bboxBufferMeters` radius (default: 5000m):

```js
const EARTH_RADIUS = 6_371_000; // meters
const latDelta = (bufferMeters / EARTH_RADIUS) * (180 / Math.PI);
const lonDelta = (bufferMeters / (EARTH_RADIUS * cos(lat))) * (180 / Math.PI);

bbox = [lon - lonDelta, lat - latDelta, lon + lonDelta, lat + latDelta];
// [west, south, east, north]
```

For a 1-hectare (100m × 100m) field, the 5km buffer ensures the entire farm is captured even with GPS imprecision.

---

## Coordinate Reference System

Sentinel Hub expects coordinates in **WGS84 (EPSG:4326)** — standard latitude/longitude. No projection conversion needed when storing lat/lon from the farms table.

---

## Temporal Considerations

- **Image acquisition:** Sentinel-2 passes are pre-scheduled; imagery is not on-demand.
- **Processing time:** L2A surface reflectance products are available 1-3 hours after acquisition.
- **Cache TTL (6h):** Conservative choice — Sentinel Hub imagery doesn't change within a day. Reduce to 1h for more responsive updates at the cost of more API calls.
- **Best season:** Low cloud cover periods (dry season, post-monsoon) give the most reliable NDVI readings.

---

## Precision Agriculture Interpretation

### Growing Season NDVI Benchmarks

| Crop Stage | Expected NDVI |
|------------|---------------|
| Bare soil (pre-sowing) | 0.05 – 0.15 |
| Germination | 0.15 – 0.25 |
| Vegetative growth | 0.30 – 0.55 |
| Peak canopy (flowering) | 0.55 – 0.80 |
| Senescence (pre-harvest) | 0.30 – 0.50 |
| Post-harvest residue | 0.05 – 0.20 |

### Common Issues Detected by NDVI

| NDVI Pattern | Likely Cause |
|--------------|-------------|
| Sudden localized drop | Pest attack, disease patch |
| Gradual field-wide decline | Water stress, nutrient deficiency |
| Striped pattern | Irrigation row failure |
| Low NDVI in wet areas | Waterlogging |
| No vegetation signal | Harvested or fallow field |
