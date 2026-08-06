# AgriCast AI Frontend — Project Structure (this pass)

Only new/changed files are listed. Everything else in `frontend/src`
(Landing, Login, Register, Farms, Auth, Dashboard shell, lib, i18n
infra) is untouched from the uploaded project.

```
frontend/src/
├── layouts/
│   └── FarmWorkspaceLayout.jsx        # NEW — tab shell for a single farm's modules
│
├── pages/
│   ├── ProfilePage.jsx                # NEW — read-only account info
│   └── SettingsPage.jsx               # NEW — theme (display-only) / language / units / notifications
│
├── components/common/
│   ├── ErrorState.jsx                 # NEW — shared error box + retry button
│   └── TrendLineChart.jsx             # NEW — shared Chart.js line chart (weather + analytics)
│
├── lib/
│   └── weatherCodes.js                # NEW — WMO weather-code → label/icon map
│
└── features/
    ├── weather/
    │   ├── api/weather.api.js
    │   ├── hooks/  weatherKeys.js, useCurrentWeather.js, useHourlyWeather.js,
    │   │           useDailyWeather.js, useWeatherHistory.js
    │   ├── components/  CurrentWeatherCard.jsx, HourlyForecastStrip.jsx,
    │   │                DailyForecastList.jsx, WeatherAlerts.jsx, WeatherSkeleton.jsx
    │   └── pages/WeatherPage.jsx
    │
    ├── satellite/
    │   ├── api/satellite.api.js
    │   ├── hooks/  satelliteKeys.js, useSatelliteLayers.js, useSatelliteImage.js,
    │   │           useSatelliteMetadata.js
    │   ├── components/  FarmBoundaryMap.jsx, LayerSelector.jsx,
    │   │                SatelliteImageViewer.jsx, SceneList.jsx
    │   └── pages/SatellitePage.jsx
    │
    ├── ai/
    │   ├── api/ai.api.js
    │   ├── hooks/  aiKeys.js, useLatestRecommendation.js,
    │   │           useRecommendationHistory.js, useGenerateRecommendation.js
    │   ├── components/  ConfidenceMeter.jsx, RecommendationCard.jsx,
    │   │                RecommendationHistoryList.jsx
    │   └── pages/AdvisoryPage.jsx
    │
    ├── analytics/
    │   ├── api/analytics.api.js
    │   ├── hooks/  analyticsKeys.js, useDashboardAnalytics.js,
    │   │           useWeatherAnalytics.js, useRecommendationAnalytics.js
    │   ├── lib/extractSeries.js         # defensive trend-point → chart-series mapping
    │   ├── components/StatCard.jsx
    │   └── pages/AnalyticsPage.jsx
    │
    ├── reports/
    │   ├── api/reports.api.js
    │   ├── hooks/  reportKeys.js, useReports.js, useGenerateReport.js,
    │   │           useDeleteReport.js, useDownloadReport.js
    │   ├── components/  GenerateReportForm.jsx, ReportCard.jsx
    │   └── pages/ReportsPage.jsx
    │
    └── settings/
        └── useSettings.js              # localStorage-backed, no backend module exists
```

## Changed files

- `src/App.jsx` — added `FarmWorkspaceLayout` nesting with the 5 new
  module routes, plus `/dashboard/profile` and `/dashboard/settings`.
- `src/components/common/Sidebar.jsx` — added `profile` and `settings`
  nav entries.
- `src/i18n/locales/en/translation.json` — added `nav.profile`,
  `nav.settings` keys only (5 new modules render plain English, see
  `FrontendCompletionReport.md`).
- `src/features/farms/pages/FarmDetailsPage.jsx` — removed the
  duplicate farm-name/crop heading now shown by `FarmWorkspaceLayout`.

## Route map (new)

```
/dashboard/farms/:id            → FarmWorkspaceLayout
  ├─ (index)                    → FarmDetailsPage   (Overview tab)
  ├─ weather                    → WeatherPage
  ├─ satellite                  → SatellitePage
  ├─ advisory                   → AdvisoryPage
  ├─ analytics                  → AnalyticsPage
  └─ reports                    → ReportsPage

/dashboard/profile               → ProfilePage
/dashboard/settings              → SettingsPage
```
