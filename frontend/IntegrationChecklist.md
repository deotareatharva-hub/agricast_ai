# AgriCast AI — Integration Checklist

Run through this before treating the 5 new modules as done. Everything
here was built strictly from the `*Guide.md` docs, not against a live
backend (see `FrontendCompletionReport.md` for why), so the first real
test against your running API is the actual integration step.

## Environment

- [ ] `frontend/.env` has `VITE_API_BASE_URL` pointing at your running
      backend (default assumed: `http://localhost:5000/api/v1`).
- [ ] Backend `.env` has real `SENTINEL_CLIENT_ID`/`SECRET` — without
      them, Satellite will correctly show its error state (by design,
      per `SatelliteGuide.md`), not silently fail.
- [ ] Backend has a working Grok/AI credential — without it,
      `POST /ai/recommend` will 500 and the Advisory page's toast error
      will fire; that's expected, not a frontend bug.

## Per-module checks

### Weather
- [ ] `GET /weather/current|hourly|daily/:farmId` return the field
      names assumed in `CurrentWeatherCard`, `HourlyForecastStrip`,
      `DailyForecastList`: `temperature`, `weatherCode`, `humidity`,
      `windSpeed`, `pressure`, `uvIndex`, `units`, `rainProbability`
      (hourly), `temperatureMax/Min`, `rainProbabilityMax` (daily).
- [ ] `GET /weather/history/:farmId` returns `data.history` as an
      array of `{ time|date, temperature }` — confirm the exact key
      (`time` vs `date`) matches `WeatherPage.jsx`'s fallback.

### Satellite
- [ ] `GET /satellite/layers` → `data.layers[]` with `id`/`label`/
      `description` — drives `LayerSelector`.
- [ ] `GET /satellite/image/:farmId?layer=` → confirm `imageBase64` is
      valid and `mimeType` is set; `SatelliteImageViewer` builds a
      data URI directly from these two fields.
- [ ] Confirm 404 vs 500 behavior matches `ErrorState`'s generic retry
      messaging — no special-casing was added for "credentials not
      configured" vs "farm not found".

### AI Advisory
- [ ] `POST /ai/recommend` 201 response shape matches
      `RecommendationCard` exactly: `summary`, `confidence`,
      `irrigation.{action,reason}`, `harvest.{action,reason}`,
      `diseaseRisk.{level,reason}`, `alerts[]`, `nextReview`,
      `createdAt`.
- [ ] `GET /ai/history/:farmId` → confirm the response key is
      `data.history` (assumed) vs a bare array — `useRecommendationHistory`
      has a fallback but double-check it picked the right one.
- [ ] `GET /ai/latest/:farmId` with no recommendations yet returns
      `{ recommendation: null }` — confirm the empty state renders
      (it should, `AdvisoryPage` checks for a falsy value).

### Analytics
- [ ] `GET /analytics/dashboard/:farmId` → confirm
      `data.weather.summary.temperature.{avg,min,max}` and
      `data.recentRecommendations[]` shapes.
- [ ] `GET /analytics/weather/:farmId` → **confirm the actual field
      names for humidity/rainfall/wind on each trend point** (only
      `temperature` was documented in `AnalyticsGuide.md`). Update
      `features/analytics/lib/extractSeries.js`'s key names
      (`"humidity"`, `"rainfall"`, `"wind"`) to match once known.
- [ ] `GET /analytics/recommendations/:farmId` → confirm the trend
      array key (`data.trend` assumed) and that each point has a
      `confidence` field.

### Reports
- [ ] `POST /reports/generate` → confirm 201 body has `id`,
      `reportType`, `fileType`, `downloadUrl`, `generatedAt`.
- [ ] `GET /reports?farmId=` → confirm `data.reports` (assumed) is the
      array key.
- [ ] `GET /reports/:id/download` → confirm it streams with a
      `Content-Type` header that matches `fileType` (pdf/csv/json) —
      `useDownloadReport` relies on the browser's blob handling, not a
      hardcoded extension list.
- [ ] Test all three `fileType`s at least once — PDF generation
      (PDFKit) is the most likely to have an edge case with missing
      optional data (no satellite/AI/sensor yet for a brand-new farm).

## Cross-cutting

- [ ] Confirm `401` handling still works from these new API calls —
      they go through the same `lib/axios.js` instance, so an expired
      token should still clear and (via `ProtectedRoute`) redirect to
      login the same way it does today.
- [ ] Farm ownership 404s (someone else's `farmId`) should surface as
      the generic `ErrorState` message on every new page — verify none
      of them crash on a `404` the way they might on a network error.
