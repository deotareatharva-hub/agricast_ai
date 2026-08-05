# Weather Module - Testing Checklist

## Navigation
- [ ] "Weather" appears in the desktop sidebar and mobile drawer nav.
- [ ] `/dashboard/weather` with 0 farms shows the "no farms" empty state
      with an "Add farm" action.
- [ ] `/dashboard/weather` with 1+ farms shows a farm picker grid.
- [ ] Clicking a farm in the picker navigates to
      `/dashboard/farms/:farmId/weather`.
- [ ] "Weather" link on a `FarmCard` (My Farms grid) goes straight to
      that farm's weather page.
- [ ] "Weather" button on `FarmDetailsPage` goes to that farm's weather
      page.
- [ ] Breadcrumb on the weather page reads My Farms → <farm name> →
      Weather, and both links work.

## Loading / error / empty states
- [ ] Throttle/slow the network - `WeatherSkeleton` renders and roughly
      matches the loaded layout (no big content jump).
- [ ] Force a 500/network error on `/weather/current` - `WeatherErrorState`
      renders with a working Retry button.
- [ ] Force an empty response - `EmptyWeatherState` renders instead of a
      blank page.
- [ ] Hourly/daily endpoints empty independently of current - hourly and
      7-day sections show their own empty states without breaking the
      rest of the page.

## Current conditions
- [ ] Hero shows correct temperature, icon, condition text, feels-like,
      today's high/low.
- [ ] Current conditions grid shows humidity, pressure, wind + compass
      direction, UV index + band label, visibility, precipitation.
- [ ] "Observed at" time is shown and formatted per the active language.
- [ ] Refresh button re-fetches current + hourly + daily and shows a
      loading spinner while in flight.
- [ ] Current conditions refetch automatically after ~10 minutes with
      the page left open (check network tab).

## Hourly forecast
- [ ] Strip scrolls horizontally on desktop and touch-scrolls on mobile.
- [ ] First tile reads "Now" instead of an hour.
- [ ] Rain-probability chip color intensifies with higher probability.
- [ ] Each tile is keyboard-focusable (Tab) and shows a visible focus ring.

## 7-day forecast
- [ ] First row reads "Today".
- [ ] Min/max bar's filled segment position is visually consistent with
      the week's overall range (a cooler day's bar sits left of a hotter
      day's).
- [ ] Row hides the rain/wind/UV column on narrow screens but keeps
      icon + temps.

## Highlights & summary
- [ ] Sunrise/sunset render when `daily[0]` includes them; omitted
      gracefully when it doesn't.
- [ ] UV tip text changes with the UV band (low/moderate/high/very
      high/extreme).
- [ ] Summary sentence mentions rain chance only when today's
      `precipitationProbabilityMax` is ≥ 40%.

## Alerts
- [ ] With `alerts: []` or missing, no alerts section renders (no empty
      box).
- [ ] With one or more alerts, each renders with the right severity
      color and an "Until <time>" line when `endTime` is present.

## History tab
- [ ] Default range is the last 7 days.
- [ ] Changing start/end date re-fetches (check query key change in
      devtools) and is debounce-free but doesn't fire on every
      keystroke (native date input only fires on change).
- [ ] Picking a start date after the end date auto-swaps them instead of
      erroring.
- [ ] Picking a range further back than 90 days from the end date clamps
      instead of requesting an enormous range.
- [ ] Summary stat cards (avg temp, total rain, avg humidity, avg wind)
      match the underlying data for a known range.
- [ ] All four trend tabs (Temperature/Humidity/Rain/Wind) render a
      chart; switching tabs doesn't leave a stale chart from the
      previous tab.
- [ ] Temperature trend shows both max (solid) and min (dashed) lines.
- [ ] Empty range shows `EmptyWeatherState`, not a blank chart.

## Responsiveness & accessibility
- [ ] Page is usable at 360px width (mobile) through desktop widths -
      no horizontal overflow outside the intentionally-scrollable
      strips.
- [ ] All interactive elements (refresh, tabs, retry, farm cards, hourly
      tiles) are reachable via keyboard and show `focus-ring`.
- [ ] Headings use one visible `h1` (via `PageHeader`) and section
      `h2`s - check with a heading-outline extension.
- [ ] `prefers-reduced-motion: reduce` (OS setting) removes/shortens
      Framer Motion animations - the existing global CSS rule in
      `index.css` already covers this; verify it isn't overridden.
- [ ] Color contrast on the gradient hero text passes AA at both light
      and dark gradient tones (clear vs storm).

## Internationalization
- [ ] Switch language to Hindi (हिंदी) and Marathi (मराठी) via the
      existing language switcher - every Weather label, including chart
      legends' surrounding copy and date/time formatting, updates.
- [ ] No raw i18n keys (e.g. `weather.fields.humidity`) are visible
      anywhere in the UI in any of the three languages.

## Regression (existing app)
- [ ] Login, Register, Dashboard, My Farms, Add/Edit/Delete Farm all
      still work unchanged.
- [ ] No console errors/warnings introduced on any existing page.
- [ ] `npm run build` completes without errors after `npm install`.
