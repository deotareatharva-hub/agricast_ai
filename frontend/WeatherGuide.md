# Weather Module - User & Developer Guide

## What this is

A farm-scoped weather experience for AgriCast AI: current conditions, a
24-hour forecast, a 7-day outlook, and historical trends, for whichever
farm the signed-in user selects. It lives entirely under
`src/features/weather/` and follows the same feature-folder pattern as
`src/features/farms/`.

The frontend **never** calls Open-Meteo (or any weather provider)
directly. Every request goes through the existing authenticated `api`
axios instance (`src/lib/axios.js`), which already attaches the JWT and
handles 401s - see `src/features/weather/api/weather.api.js`.

## How a user gets there

- **Sidebar / mobile drawer** - a new "Weather" nav item
  (`/dashboard/weather`). If the farmer has multiple farms, they land on
  a farm picker first; picking a farm navigates to
  `/dashboard/farms/:farmId/weather`.
- **From a farm** - `FarmCard` (on My Farms) and `FarmDetailsPage` both
  now have a "Weather" link/button that goes straight to that farm's
  weather, skipping the picker.

## What's on the page

1. **Alerts** (if the backend sends any) at the top.
2. **Hero** - big current-conditions banner: temperature, condition icon,
   feels-like, today's high/low, humidity, wind.
3. **Summary** - one plain sentence ("It's partly cloudy today with a
   high of 32°C...").
4. **Highlights** - sunrise/sunset, UV index with a plain-language tip,
   chance of rain, wind, humidity.
5. **Current conditions grid** - the full stat breakdown (humidity,
   pressure, wind + direction, UV, visibility, precipitation, observed
   time).
6. **Hourly forecast** - scrollable, next 24 hours, temperature + rain
   chance per hour.
7. **7-day forecast** - daily high/low with a relative temperature bar,
   condition, rain chance, wind, UV.
8. **History tab** - pick a date range, see summary stats (avg temp,
   total rain, avg humidity, avg wind) and switch between four trend
   charts (temperature, humidity, rain, wind).

Every screen has a loading skeleton, an error state with retry, and an
empty state - see `WeatherSkeleton`, `WeatherErrorState`,
`EmptyWeatherState`.

## Refreshing data

The header's refresh button re-fetches current + hourly + daily in
parallel. Current conditions also auto-refresh every 10 minutes in the
background (`useCurrentWeather`'s `refetchInterval`) so a page left open
doesn't go stale.

## Language support

All user-facing strings live in `src/i18n/locales/{en,hi,mr}/translation.json`
under the `weather` key, following the same structure as `farms`. Dates
and times are formatted with `Intl` using the active i18next language, so
no per-locale date-formatting code was needed.

## Extending it

- **New chart/metric**: `WeatherChart` is generic (`metric` prop selects
  color/unit/chart-type from a preset table) - add a preset instead of a
  new component.
- **New stat field**: add a tile to `CurrentWeatherCard`'s `tiles` array,
  or a card to `WeatherHighlights`' `cards` array.
- **New weather code**: add it to `WEATHER_CODE_MAP` in
  `utils/weatherCodeMap.js` - every component reads codes through that
  file, nothing else needs to change.
