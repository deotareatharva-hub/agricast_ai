# UI Architecture

## Layer map
```
index.css                     <- design tokens (source of truth for color/radius/shadow)
components/ui/*                <- dumb, reusable primitives (no business logic, no data fetching)
components/common/*             <- app-shell components (Sidebar, DashboardTopbar, Loading, ErrorState)
layouts/*                       <- route-level shells (DashboardLayout, FarmWorkspaceLayout, PublicLayout*, AuthLayout*)
features/<domain>/components/*  <- domain-specific presentational components (built on ui/ primitives)
features/<domain>/pages/*       <- page composition: wires hooks (data) to components (presentation)
features/<domain>/hooks/*       <- react-query hooks (UNCHANGED in this pass)
features/<domain>/api/*         <- axios calls to backend (UNCHANGED in this pass)
```
`*` PublicLayout/AuthLayout and everything they render (LandingPage, Login,
Register, Navbar, Footer) were intentionally **not touched** — out of scope
per "do not redesign authentication pages."

## Why a separate DashboardTopbar instead of reusing Navbar
`Navbar.jsx` is shared by the public marketing layout. The brief asks for a
dashboard-specific topbar (search, notifications, AI quick action, profile
menu) that doesn't belong on a logged-out marketing page. Rather than
branching `Navbar` internally (`isAuthenticated ? ... : ...`), a new
`DashboardTopbar.jsx` was added and wired only into `DashboardLayout`. This
keeps the two surfaces independently editable and keeps `Navbar.jsx` exactly
as it was — zero risk to the public site.

## Data flow (unchanged)
Every page still follows: `useOutletContext()` or a route param → a
react-query hook → render. `FarmWorkspaceLayout` fetches the farm once via
`useFarm(id)` and passes it down via `<Outlet context={{ farm }} />`, so
Weather/Satellite/Advisory/Analytics/Reports pages never duplicate that
fetch. This was already the architecture before the redesign and nothing
about it changed.

## Orphaned code found (left untouched)
During the audit for this redesign, two clusters of dead code were found:
- `src/components/dashboard/*` — mostly empty stub files
  (`AIRecommendationCard.jsx`, `FarmHealthCard.jsx`, etc. are 0 bytes),
  plus two components (`QuickActions.jsx`, `WeatherHero.jsx`) that are
  never imported anywhere in the app.
- Several `features/weather/components/*` and `features/satellite/components/*`
  files (`WeatherHero`, `WeatherHeader`, `SevenDayForecast`,
  `SatelliteHero`, `NDVICard`, `HealthScoreCard`, etc.) that are not
  imported by any routed page.

Per "do not regenerate completed feature modules" and to avoid touching
code with unknown intent, these were left exactly as they were. If a future
pass wants to build out a richer Dashboard/Weather/Satellite hero using
real data, these files may be useful starting points — but they are not
wired into routing today and this redesign did not wire them in, since
doing so would mean writing new data-fetching logic (out of scope for a
pure UI redesign).

## Component reuse map (who uses what)
- `components/ui/Card` → FarmCard, RecommendationCard's shell, StatCard-adjacent
  panels, Dashboard connection-status card, Weather trend chart wrapper, etc.
- `components/ui/Button` (`buttonClasses` helper) → every CTA link/button
  across Farms, Dashboard, AI Advisory, Reports
- `components/ui/EmptyState` → Farms empty state, AI Advisory "no
  recommendation yet", Reports "no reports yet", Dashboard "no farms yet"
- `components/common/Loading` / `ErrorState` → every route-level query's
  loading/error branch
