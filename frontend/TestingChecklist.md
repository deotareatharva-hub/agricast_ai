# AgriCast AI — Testing Checklist

Manual pass, in order. Do this against a real backend + at least one
seeded farm with some weather/AI history, plus one brand-new farm with
none, so both the populated and empty states get exercised.

## Setup
- [ ] `npm run build` succeeds (already verified this pass).
- [ ] `npm run dev`, log in, navigate to a farm from `/dashboard/farms`.
- [ ] Confirm the new tab bar (Overview/Weather/Satellite/AI Advisory/
      Analytics/Reports) appears above the farm name and every tab is
      reachable by URL directly (not just by clicking).

## Weather tab
- [ ] Current conditions card renders temperature, humidity, wind,
      pressure, UV without layout breaking on long numbers.
- [ ] Hourly strip scrolls horizontally on mobile width.
- [ ] 7-day forecast list renders all 7 rows.
- [ ] History chart renders when data exists; shows the "no history"
      message on a brand-new farm instead of an empty chart.
- [ ] Alerts banner appears when wind/UV/rain thresholds are crossed,
      and is absent otherwise (no empty box).
- [ ] Kill the network / stop the backend → confirm `ErrorState` +
      working "Try again" button, not a blank page or crash.

## Satellite tab
- [ ] Boundary map centers on the farm's actual lat/lng.
- [ ] Switching layers (True Color, NDVI, etc.) re-fetches and shows a
      loading state, not a stale image.
- [ ] Image "Fullscreen" opens an overlay and closes on click.
- [ ] Scene list shows capture dates + cloud cover %.
- [ ] With Sentinel Hub credentials missing/misconfigured on the
      backend, confirm the page shows `ErrorState`, not a broken image
      icon.

## AI Advisory tab
- [ ] Brand-new farm: empty state message, no crash.
- [ ] Click "Generate new recommendation" → pending state shows,
      button disables, then the card populates.
- [ ] Confidence meter color changes appropriately at low/medium/high
      values (red/yellow/green thresholds in `ConfidenceMeter.jsx`).
- [ ] Disease risk badge color matches level (Low/Medium/High).
- [ ] History list below shows prior recommendations, newest first.
- [ ] Trigger a backend failure (e.g. malformed AI response) → confirm
      a toast error appears and the page doesn't get stuck on
      "Generating…".

## Analytics tab
- [ ] Stat cards show real numbers (days active, report count, avg
      temp) rather than "—" placeholders, on a farm with data.
- [ ] Weather trend chart renders at least the temperature line.
- [ ] Recommendation confidence chart renders once ≥1 recommendation
      exists; shows the "not enough data" message before that.
- [ ] Recent recommendations list matches what's shown on the
      Advisory tab for the same farm.

## Reports tab
- [ ] Generate a PDF report → appears in the list, download works and
      the file opens correctly.
- [ ] Generate the same report again without `forceRegenerate` →
      confirm it doesn't create a duplicate (backend dedup) — or add a
      "regenerate" affordance if you want that exposed later.
- [ ] Generate a CSV and a JSON report — both download with correct
      file extensions and open correctly.
- [ ] Delete a report → disappears from the list; re-downloading a
      deleted report's old URL should fail cleanly if attempted.
- [ ] Brand-new farm with no weather cached yet → confirm report
      generation still fails gracefully with a toast, not a crash
      (weather is mandatory per `ReportsGuide.md`).

## Profile / Settings
- [ ] Profile shows correct name/email/farm count for the logged-in
      user.
- [ ] Settings language switch changes the whole app immediately,
      including already-mounted farm tabs (existing i18next behavior).
- [ ] Settings units/notifications toggle persists across a page
      refresh (localStorage) but resets on a different browser/device
      (expected — no backend for this yet).

## Cross-device / accessibility (quick pass)
- [ ] All 5 new module pages usable at a narrow (≈375px) width — tab
      bar scrolls horizontally instead of wrapping badly.
- [ ] Tab/keyboard navigation reaches the layer selector, generate
      buttons, and download/delete buttons without a mouse.
- [ ] No console errors on any of the 7 new routes on first load.
