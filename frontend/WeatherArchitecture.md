# Weather Module - Architecture

## Folder structure

```
src/features/weather/
├── api/
│   └── weather.api.js         # All weather HTTP calls (axios via lib/axios.js)
├── hooks/
│   ├── weatherKeys.js         # Query-key factory
│   ├── useCurrentWeather.js
│   ├── useHourlyWeather.js
│   ├── useDailyWeather.js
│   └── useWeatherHistory.js
├── components/
│   ├── WeatherHeader.jsx
│   ├── WeatherHero.jsx
│   ├── WeatherSummary.jsx
│   ├── WeatherAlerts.jsx
│   ├── WeatherHighlights.jsx
│   ├── CurrentWeatherCard.jsx
│   ├── HourlyForecast.jsx
│   ├── SevenDayForecast.jsx
│   ├── WeatherChart.jsx
│   ├── WeatherHistory.jsx
│   ├── WeatherStats.jsx
│   ├── WeatherFooter.jsx
│   ├── WeatherSkeleton.jsx
│   ├── WeatherErrorState.jsx
│   └── EmptyWeatherState.jsx
├── pages/
│   └── WeatherPage.jsx         # Also contains the in-page FarmPicker
└── utils/
    ├── weatherCodeMap.js       # WMO code -> icon/label/tone
    ├── weatherColors.js        # tone -> gradient/accent classes, UV bands
    ├── weatherFormatters.js    # value/date/time -> display string
    └── weatherHelpers.js       # range math, aggregation, upcoming-hours filter
```

This mirrors `src/features/farms/` exactly: an `api` layer that's the
only thing touching axios, a `hooks` layer that's the only thing
touching TanStack Query, and `components`/`pages` that only touch hooks.

## Data flow

```
WeatherPage
 ├─ useFarm(farmId)            (existing farms hook - name/location)
 ├─ useCurrentWeather(farmId)  ─┐
 ├─ useHourlyWeather(farmId)   ─┼─► weather.api.js ─► api (axios) ─► backend
 └─ useDailyWeather(farmId)    ─┘

WeatherHistory (mounted inside the History tab)
 └─ useWeatherHistory(farmId, { startDate, endDate })
```

Each hook's `queryFn` calls the matching `weatherApi` method and
`select`s the relevant slice out of the response envelope
(`response.data.current`, `.hourly`, `.daily`, `.history`) - identical
shape to `useFarms`' `select: (response) => response.data.farms`.

## Query keys & caching

`weatherKeys` scopes every entry under `["weather", farmId, ...]`, so
switching farms never serves stale cached data for the previous farm,
and each farm's cache can be invalidated independently if a future
mutation needs to (e.g. re-syncing a farm's location).

| Hook | staleTime | refetchInterval |
|---|---|---|
| `useCurrentWeather` | 5 min | 10 min (background) |
| `useHourlyWeather` | 10 min | - |
| `useDailyWeather` | 30 min | - |
| `useWeatherHistory` | 30 min | - |

## Routing

Two routes render the same `WeatherPage`:

- `/dashboard/weather` - no `farmId` param. Renders an in-page
  `FarmPicker` (reuses `useFarms`) so a farmer with several farms
  chooses one first.
- `/dashboard/farms/:farmId/weather` - direct, farm-scoped link used
  from `FarmCard` and `FarmDetailsPage`.

Both are registered in `App.jsx` under the existing `ProtectedRoute` +
`DashboardLayout` branch, lazy-loaded like every other route in the app.

## Design system reuse

Nothing in `components/ui/` was modified. The Weather module composes:
`Card`, `Button`, `Badge`, `StatCard`, `PageHeader`, `Breadcrumb`,
`ErrorState` (via the new `WeatherErrorState` wrapper), `EmptyState`
(via `EmptyWeatherState`), `Skeleton`, `Field`, `Input`, `Loading`.

The one new visual language is `WeatherHero`'s gradient/glass banner -
everything else (grids, list rows, chips) matches the existing card and
spacing conventions so the module reads as part of the app, not a bolt-on.
Gradients are derived from the existing `--color-brand-*` / `soil` /
`sky-alert` tokens in `index.css`, no new palette was introduced.

## Charts

`WeatherChart` wraps `react-chartjs-2` (already a dependency) with a
`metric` prop (`temperature | humidity | pressure | wind | rain`) that
picks color/unit/chart-type from one preset table, so every chart in the
module - hourly-adjacent or in `WeatherHistory` - goes through the same
component instead of five bespoke ones.

## New dependency

`framer-motion` was added to `package.json` (not previously installed)
to satisfy the animation requirements (fade-ins, hover lift, staggered
list reveal, alert enter/exit). Run `npm install` after pulling this
change.

## Backend contract assumption

See **WeatherIntegrationChecklist.md** for the exact endpoints and
response shapes this module expects, and where to change them if the
real backend differs.
