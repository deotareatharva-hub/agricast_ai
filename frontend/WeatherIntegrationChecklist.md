# Weather Module - Backend Integration Checklist

The actual backend weather routes/response shapes weren't included in
the uploaded project, so this frontend was built against a documented
**assumption**, mirroring the existing `farmApi` conventions as closely
as possible. Everything in this checklist lives in exactly **one** file
each - update those, and no component needs to change.

## 1. Endpoint paths - `src/features/weather/api/weather.api.js`

Assumed (farm-scoped, matching the `/farms/:id` nesting already used by
`farm.api.js`):

| Purpose | Method | Path | Query params |
|---|---|---|---|
| Current conditions | GET | `/farms/:farmId/weather/current` | - |
| Hourly forecast | GET | `/farms/:farmId/weather/hourly` | `hours` (optional) |
| Daily forecast | GET | `/farms/:farmId/weather/daily` | `days` (optional) |
| History | GET | `/farms/:farmId/weather/history` | `startDate`, `endDate` (YYYY-MM-DD) |

**If your backend instead uses a flat `?farmId=` style** (e.g.
`/weather/current?farmId=X`), update the four calls in `weatherApi` -
nothing else references the path shape.

## 2. Response envelope & field names

Assumed envelope (same as `farmApi`: `{ success, data: { <key>: ... } }`):

```jsonc
// GET /farms/:farmId/weather/current
{
  "success": true,
  "data": {
    "current": {
      "temperature": 29.4,        // °C
      "feelsLike": 31.2,          // °C
      "humidity": 62,             // %
      "pressureMsl": 1008,        // hPa
      "windSpeed": 14,            // km/h
      "windDirection": 220,       // degrees
      "uvIndex": 6.2,
      "visibility": 10000,        // meters
      "precipitation": 0,         // mm
      "weatherCode": 2,           // WMO code (Open-Meteo)
      "isDay": true,
      "observedAt": "2026-08-05T09:00:00Z",
      "alerts": []                // OPTIONAL - see below
    }
  }
}
```

```jsonc
// GET /farms/:farmId/weather/hourly
{ "success": true, "data": { "hourly": [
  {
    "time": "2026-08-05T10:00:00Z",
    "temperature": 30.1,
    "precipitationProbability": 20,  // %
    "precipitation": 0,              // mm
    "windSpeed": 12,
    "weatherCode": 1,
    "isDay": true
  }
  // ...
] } }
```

```jsonc
// GET /farms/:farmId/weather/daily
{ "success": true, "data": { "daily": [
  {
    "date": "2026-08-05",
    "tempMax": 33.2,
    "tempMin": 24.1,
    "precipitationProbabilityMax": 40,
    "windSpeedMax": 18,
    "uvIndexMax": 7.1,
    "weatherCode": 2,
    "sunrise": "2026-08-05T06:02:00Z",
    "sunset": "2026-08-05T18:44:00Z"
  }
  // ... 7 entries
] } }
```

```jsonc
// GET /farms/:farmId/weather/history?startDate=2026-07-29&endDate=2026-08-05
{ "success": true, "data": { "history": [
  {
    "date": "2026-07-29",
    "tempMax": 32.5,
    "tempMin": 23.8,
    "tempAvg": 27.9,        // optional - derived from max/min if absent
    "humidityAvg": 58,
    "precipitationSum": 4.2,
    "windSpeedAvg": 10
  }
  // ...
] } }
```

**Where to fix a mismatch:**
- Field names differ → adjust the `select` callback in the matching hook
  (`useCurrentWeather.js`, `useHourlyWeather.js`, `useDailyWeather.js`,
  `useWeatherHistory.js`) or add a small mapping function in
  `weather.api.js`.
- Weather codes aren't WMO/Open-Meteo codes → remap in
  `utils/weatherCodeMap.js`'s `WEATHER_CODE_MAP`.
- Units differ (e.g. °F, mph) → adjust `utils/weatherFormatters.js`.

## 3. Weather alerts (optional)

`WeatherAlerts` renders only if `current.alerts` is a non-empty array.
Expected shape per alert:

```jsonc
{ "id": "alert-1", "severity": "severe" | "moderate" | "minor", "title": "...", "description": "...", "endTime": "2026-08-05T18:00:00Z" }
```

If the backend doesn't produce alerts yet, no change is needed - the
component silently renders nothing.

## 4. Auth

No work needed - `weatherApi` uses the shared `api` axios instance from
`lib/axios.js`, which already attaches `Authorization: Bearer <token>`
to every request and redirects on 401 via the existing
`onUnauthorized` listener.

## 5. Steps to go live

1. Confirm/adjust the four paths in `weather.api.js` against the real
   backend routes.
2. Confirm/adjust field names in the four hooks' `select` callbacks.
3. Confirm the weather-code source (Open-Meteo WMO codes assumed) -
   remap in `weatherCodeMap.js` if different.
4. Run `npm install` (adds `framer-motion`).
5. Set `VITE_API_BASE_URL` in `.env` if not already pointing at the
   right backend (existing convention, unchanged).
6. Manually verify each item in **WeatherTestingChecklist.md**.
