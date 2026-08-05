# AgriCast AI — Frontend Analysis Report

**Scope:** Analysis only. No code generated. No pages built. Nothing redesigned.

---

## ⚠️ Critical Finding Before Anything Else

The backend ZIP is **not just a backend** — it contains a working `frontend/` folder at
`agricast/frontend/` with its own `package.json`, Vite config, routing, auth context, i18n,
Tailwind v4 theme, and a fully built **Farms** feature (API layer, hooks, forms, pages).

This changes the nature of the task from "build a foundation from zero" to
**"reconcile an existing foundation with the approved prototype and your requested stack."**
Two things need a decision from you before I generate anything:

1. **Do we adopt the existing `frontend/` folder as the base**, upgrading/aligning it to the
   prototype and your spec (recommended — it already follows solid conventions), or
   **start a brand-new frontend from scratch** and treat the existing one as reference-only?
2. **Tailwind version conflict:** the existing frontend uses **Tailwind v4** (`@tailwindcss/vite`,
   CSS-first `@theme` tokens in `index.css`, no `tailwind.config.js`). A traditional
   `tailwind.config.js` (v3-style) is what's usually meant by "Tailwind Configuration." I'll
   default to **staying on v4** (it's already installed and configured) and generate the
   "Tailwind Configuration" as the v4 `@theme` block unless you tell me you want v3.

I've analyzed both the existing frontend and the prototype in detail below so you can decide with
full information. Everything past this point is analysis — I have not written any foundation code.

---

## 1. Existing Backend

**Stack:** Node.js + Express, PostgreSQL via Drizzle ORM, JWT auth, Helmet/CORS/Morgan, express-validator.

**Architecture pattern:** Strict modular layering, repeated identically across all 7 modules:

```
module/
  <name>.routes.js       → Express router, wires validators + controller
  <name>.controller.js   → thin: validate → call service → shape ApiResponse
  <name>.service.js      → business logic, ownership scoping
  <name>.repository.js   → DB access via Drizzle
  <name>.schema.js        → Drizzle table schema (in db/schema/) / response schema
  <name>.validation.js / .validator.js → express-validator chains
```

**Modules present:** `auth`, `farms`, `weather`, `satellite`, `ai`, `reports`, `analytics`.

**Cross-cutting conventions the frontend must respect:**
- Every response is wrapped: `{ success, message, data }` (via `ApiResponse` class).
- Every error is wrapped: `{ success: false, message, ... }` with a matching HTTP status
  (via `ApiError` — 400/401/403/404/409/500).
- Auth: `Authorization: Bearer <JWT>` header, verified by `requireAuth` middleware, which
  attaches `req.user = { id, email }`. Every farm-scoped resource is filtered server-side by
  `req.user.id` — the frontend never needs to (and shouldn't) pass a user ID explicitly.
- API is mounted under a global prefix: **`/api/v1`** (`env.apiPrefix`), base URL configurable
  via `CORS_ORIGIN` / `DATABASE_URL` on the backend, and `VITE_API_BASE_URL` on the frontend
  (already wired in the existing `lib/axios.js` to default to `http://localhost:5000/api/v1`).
- Farm-scoped resources (`weather`, `satellite`, `ai`, `reports`, `analytics`) all key off
  `:farmId` in the URL — meaning **almost every non-farms page needs a "currently selected
  farm" concept**, which matches the prototype's farm-picker in the top bar exactly.

---

## 2. Existing APIs (endpoint inventory)

| Module | Method | Path | Auth | Notes |
|---|---|---|---|---|
| Health | GET | `/health` | none | liveness check |
| Auth | POST | `/auth/register` | none | returns `{ user, token }` |
| Auth | POST | `/auth/login` | none | returns `{ user, token }` |
| Auth | GET | `/auth/me` | ✅ | current profile |
| Farms | POST | `/farms` | ✅ | create |
| Farms | GET | `/farms` | ✅ | list (supports query filters) |
| Farms | GET | `/farms/:id` | ✅ | detail |
| Farms | PUT | `/farms/:id` | ✅ | update |
| Farms | DELETE | `/farms/:id` | ✅ | delete |
| Weather | GET | `/weather/current/:farmId` | ✅ | |
| Weather | GET | `/weather/hourly/:farmId` | ✅ | |
| Weather | GET | `/weather/daily/:farmId` | ✅ | |
| Weather | GET | `/weather/history/:farmId?startDate=&endDate=` | ✅ | |
| Satellite | GET | `/satellite/layers` | ✅ | available NDVI/etc. layers |
| Satellite | GET | `/satellite/image/:farmId?layer=&startDate=&endDate=` | ✅ | |
| Satellite | GET | `/satellite/metadata/:farmId?...` | ✅ | |
| AI | POST | `/ai/recommend` | ✅ | generate recommendation |
| AI | GET | `/ai/history/:farmId?limit=&offset=` | ✅ | |
| AI | GET | `/ai/latest/:farmId` | ✅ | |
| Reports | POST | `/reports/generate` | ✅ | |
| Reports | GET | `/reports?farmId=&reportType=&limit=&offset=` | ✅ | |
| Reports | GET | `/reports/:id/download` | ✅ | file download |
| Reports | GET | `/reports/:id` | ✅ | |
| Reports | DELETE | `/reports/:id` | ✅ | |
| Analytics | GET | `/analytics/dashboard/:farmId` | ✅ | |
| Analytics | GET | `/analytics/weather/:farmId` | ✅ | |
| Analytics | GET | `/analytics/recommendations/:farmId` | ✅ | |
| Analytics | GET | `/analytics/monthly/:farmId` | ✅ | |
| Analytics | GET | `/analytics/weekly/:farmId` | ✅ | |
| Analytics | GET | `/analytics/summary/:farmId` | ✅ | |

This maps almost one-to-one onto your requested routes (`/farms`, `/weather`, `/satellite`,
`/ai`, `/analytics`, `/reports`) — each route's page will primarily consume its matching module.

---

## 3. Pages Detected in HTML Prototype

The prototype is a single `index.html` acting as an SPA shell with hash-free JS-driven view
switching (`data-nav` / `data-view` + a `go(target)` router in `script.js`). It cleanly maps to
distinct top-level pages plus nested "app views":

**Top-level pages (outside the app shell):**
| Prototype id | Purpose | Maps to route |
|---|---|---|
| `page-landing` | Marketing/landing page | `/` |
| `page-login` | Login form | `/login` |
| `page-register` | Register form | `/register` |
| `page-404` | Error page | `/404` |

**App-shell views (inside `#appShell`, authenticated):**
| `data-view` | Purpose | Maps to route |
|---|---|---|
| `dashboard` | Home/overview: weather hero, sun-arc card, alerts, quick actions, farm-scoped forecast strip, timeline, recent reports | `/dashboard` |
| `farms` | Farm grid/list | `/farms` |
| `farm-detail` | Single farm detail | `/farms/:id` (implied — prototype nests this under farms) |
| `weather` | Full forecast, timeline, rain/temp charts | `/weather` |
| `satellite` | NDVI map, layer toggle | `/satellite` |
| `ai` | AI advisor, recommendation history | `/ai` |
| `analytics` | Multi-chart season trends | `/analytics` |
| `reports` | Report grid, generate button | `/reports` |
| `profile` | Profile card, stats | `/profile` |
| `settings` | Toggles (rain alerts, disease-risk alerts) | `/settings` |

**Overlays (not routes, global UI):**
- Farm-picker bottom sheet (`#sheetBackdrop`) — a `Drawer`-style modal.
- Mobile bottom nav (`#bottomNav`) — 5-item mobile-first nav (Home / Weather / **AI (center,
  raised)** / Satellite / Profile).

This is a very close match to your requested route list — the only structural note is that
**`farm-detail` is a nested/child view of `farms`** in the prototype (`data-match="farms
farm-detail"` keeps the sidebar link active on both), which suggests `/farms/:id` as a child
route rather than a flat sibling.

---

## 4. Components Detected in Prototype

Recurring, reusable UI patterns identified directly from the markup/CSS classes:

**Layout / chrome**
- `side-nav` — desktop sidebar (brand mark, nav links, settings/profile pinned to bottom)
- `top-bar` — mobile menu button, farm-picker button, language switch, alert bell w/ badge, avatar
- `bottom-nav` — mobile-only, 5 items, center item raised/highlighted (AI Advisor)
- `sheet-backdrop` / `sheet` — bottom-sheet modal (farm picker)

**Cards** (all extend a base `.card` with modifiers: `card--weather`, `card--ai`,
`card--ai-big`, `card--map`, `span-2`, `span-3` for grid sizing)
- `card--weather` → **WeatherCard** (hero temp, condition icon, stat row)
- `sun-arc-card` → a bespoke sunrise/sunset arc widget (dashboard-only, likely a sub-component
  of WeatherCard rather than its own library entry)
- `card--ai` / `card--ai-big` → **RecommendationCard** (AI advisor tips)
- `card--map` → **MapCard** (satellite/NDVI, wraps React Leaflet)
- `farm-card` → **FarmCard** (image, name, location, acreage, crop tags)
- `report-card` → **ReportCard** (icon, title, description, date) — not explicitly in your list;
  recommend adding it alongside `ForecastCard`
- `chart-placeholder` → **ChartCard** (wraps Chart.js line/bar charts — rain, temp, NDVI,
  humidity, wind)
- `t-card` (testimonial), `feature-card` (landing page only — lower reuse priority)
- `profile-card`, `settings-card` — page-specific composite cards

**Data widgets**
- `forecast-strip` → **ForecastCard** list (horizontal scroll of day chips)
- `timeline` → hourly forecast row (`tl-hour` items) — a variant/child of ForecastCard
- `alert-list` / `alert-list__item--warn|info` → **AlertCard** (color-coded by severity)
- `layer-toggle__btn` → segmented control for satellite layers
- `segmented` → generic segmented control (reused for chart range toggles etc.)

**Form / input**
- `.form`, `.field`, `.field__pw-toggle` → **Input** (with password visibility toggle variant)
- `.btn` (`--primary`, `--outline`, `--ghost`, `--lg`, `--block`) → **Button**

**Feedback**
- `icon-btn__badge` → **Badge** (notification count)
- `error-card` → 404 illustration card (page-specific)

This inventory confirms your requested component list (`Button, Input, Card, Modal, Drawer,
Sidebar, Navbar, Footer, Badge, Toast, Loader, Skeleton, WeatherCard, RecommendationCard,
FarmCard, ForecastCard, ChartCard, MapCard, AlertCard`) is correct and complete — I'd only add
**ReportCard** and **SegmentedControl** as they appear repeatedly and aren't cleanly covered by
the existing list.

---

## 5. Design Token Conflict (prototype vs. existing frontend)

The prototype and the existing `frontend/index.css` use **different palettes and fonts** —
this must be resolved before any UI is built, since the prototype is the approved source of truth.

| Token | Prototype (`style.css`) | Existing frontend (`index.css` `@theme`) |
|---|---|---|
| Primary green | `--forest #1B3A2B`, `--leaf #5B9C59` | `--color-brand-700 #24522e`, `--color-brand-500 #3d8449` |
| Accent | `--harvest #E08E3E` (orange, soil/harvest tone) | `--color-soil-500 #b8763e` (different hue) |
| Background | `--warm-white #FBF7EE` | `neutral-50` (Tailwind default gray) |
| Display font | `Fraunces` (serif, headings) | none — `Inter` only |
| Body font | `Public Sans` | `Inter` |
| Mono font | `IBM Plex Mono` (eyebrows/labels) | none |
| Radii | `12 / 18 / 28 / pill` named scale | not tokenized |
| Shadows | `sm / md / lg` named scale | not tokenized |

**Recommendation:** replace the existing `@theme` block in `index.css` with tokens matching the
prototype 1:1 (forest/leaf/harvest/warm-white + Fraunces/Public Sans/IBM Plex Mono + the named
radius/shadow scale), rather than keep the current brand/soil palette. This is a foundation-layer
fix, not a redesign — it makes the existing scaffold match the *already-approved* UI.

---

## 6. Suggested React Architecture

Adopt and extend the pattern already established in `features/farms`:

```
feature/
  api/          → one object per feature, all axios calls, nothing else touches axios directly
  hooks/        → TanStack Query hooks + a queryKey factory (e.g. farmKeys.js)
  components/   → feature-specific UI (FarmCard, FarmForm, etc.)
  pages/        → route-level components, composed from hooks + components
  validation/   → React Hook Form schemas
```

This is a **feature-first (vertical slice)** architecture rather than a type-first one (no global
`/components/weather`, `/components/ai` etc.) — new modules (`weather`, `satellite`, `ai`,
`analytics`, `reports`) should each become a sibling of `features/farms`, following identical
internal structure. Shared, cross-feature UI (Button, Card, Modal, Navbar...) stays in
`components/common` (already the convention) or a renamed `components/ui` for pure design-system
pieces vs. `components/common` for app-chrome (Navbar/Sidebar/Footer).

**Layers, bottom to top:**
1. `lib/axios.js` — single Axios instance, token interceptor, error normalization (exists)
2. `features/*/api/*.api.js` — typed request functions per module
3. `features/*/hooks/*` — TanStack Query wrappers (`useQuery`/`useMutation`) + key factories
4. `context/` — cross-cutting state that isn't server state: `AuthContext` (exists),
   `ThemeContext` (new — for future dark mode / accessibility, farmer-facing so likely thin),
   `LanguageContext` (new — thin wrapper around `react-i18next`, or rely on i18next directly
   and skip a context if no extra state is needed)
5. `features/*/components/*` — presentational + feature-connected components
6. `layouts/` — `PublicLayout`, `AuthLayout`, `DashboardLayout` (exist) — DashboardLayout needs
   extension for the mobile bottom-nav + farm-picker sheet seen in the prototype
7. `pages/` + `features/*/pages/*` — route targets
8. `App.jsx` / route config — composes layouts + guards + pages

---

## 7. Reusable Components (library plan)

| Component | Notes |
|---|---|
| Button | variants: primary / outline / ghost, sizes incl. `lg`, `block` modifier |
| Input | incl. password-visibility toggle variant |
| Card | base + modifiers (`span-2`, `span-3`, colored variants) |
| Modal | for confirm dialogs (existing `ConfirmDialog.jsx` in farms feature is a candidate to promote to shared) |
| Drawer | prototype's bottom-sheet (farm picker) — mobile-first slide-up pattern |
| Sidebar | desktop nav (exists as part of `DashboardLayout`, should be extracted) |
| Navbar | exists (`components/common/Navbar.jsx`) — needs top-bar features added (farm-picker, alerts badge) |
| Footer | exists — landing/public only |
| Badge | notification-count style, also useful for status tags |
| Toast | via `react-toastify`, already wired in `App.jsx` |
| Loader | exists (`Loading.jsx`) — used by route guards already |
| Skeleton | `FarmListSkeleton.jsx` exists — generalize into a shared `Skeleton` primitive |
| WeatherCard | new |
| RecommendationCard | new |
| FarmCard | exists in `features/farms/components` — confirm it matches prototype styling |
| ForecastCard | new (covers both the day-strip and hourly-timeline variants) |
| ChartCard | new — thin wrapper around `react-chartjs-2` for consistent card chrome |
| MapCard | new — wraps `react-leaflet` |
| AlertCard | new — severity-based (`warn` / `info` / `danger`) |
| ReportCard | new — not in original list, present in prototype |
| SegmentedControl | new — not in original list, reused across satellite/analytics/charts |

---

## 8. Routing Structure

```
/                     PublicLayout      → LandingPage
/login                AuthLayout + PublicOnlyRoute → LoginPage
/register             AuthLayout + PublicOnlyRoute → RegisterPage

/dashboard             DashboardLayout + ProtectedRoute → DashboardPage
/farms                                              → MyFarmsPage
/farms/:id                                          → FarmDetailPage   (prototype treats as nested)
/weather                                            → WeatherPage
/satellite                                          → SatellitePage
/ai                                                 → AiAdvisorPage
/analytics                                          → AnalyticsPage
/reports                                            → ReportsPage
/profile                                            → ProfilePage
/settings                                           → SettingsPage

*                                                   → NotFoundPage (404)
```

Note: your requested list has `/farms` as flat; the existing scaffold currently nests it under
`/dashboard/farms` (e.g. `/dashboard/farms/new`). Since your explicit route list uses flat
top-level paths, I'll flatten these during the foundation build unless you say otherwise —
this is a routing-config change only, not a rebuild of the farms feature itself.

Route guarding reuses the existing, working pattern: `ProtectedRoute` (redirect to `/login` if
unauthenticated) and `PublicOnlyRoute` (redirect to `/dashboard` if already authenticated) — both
already implemented and already correctly wired to `AuthContext`'s `isInitializing` flag to avoid
a login-flash on refresh.

---

## 9. State Management Strategy

- **Server state:** TanStack Query exclusively. One query-key factory per feature (pattern
  already set by `farmKeys.js`). No server data duplicated into Context or component state.
- **Auth state:** React Context (`AuthContext`, exists) — token in `localStorage` via
  `tokenStorage`, attached by an Axios request interceptor; 401 responses clear the token
  globally via the existing response interceptor.
- **Selected-farm state:** not yet present in the existing scaffold, but required by the
  prototype's farm-picker (top bar) since weather/satellite/ai/analytics endpoints are all
  `:farmId`-scoped. Proposed as a small dedicated context (`FarmContext` / `SelectedFarmContext`)
  or persisted alongside auth — a decision point for the actual build, flagged here for now.
- **Language state:** `react-i18next` + `i18next-browser-languagedetector`, already configured
  for `en` / `hi` / `mr`, persisted to `localStorage`. A thin `LanguageContext` is optional —
  i18next's own hook (`useTranslation`) may be sufficient without extra wrapping.
- **Theme state:** no dark mode in the prototype; `ThemeContext` scoped minimally for now
  (design tokens only), not a light/dark toggle, unless you want one added.
- **Local/UI state:** component-level `useState` (modals open/closed, form state via React Hook
  Form, segmented-control selection, etc.) — no global store needed beyond the above.
- **Error handling:** centralized in the Axios response interceptor (exists) + a top-level
  `ErrorBoundary` (new) for render-time errors + `react-toastify` for user-facing error/success
  messages.

---

## 10. Folder Structure (proposed foundation)

Building on what already exists rather than replacing it:

```
frontend/
├── public/
│   ├── favicon.svg
│   └── icons.svg
├── src/
│   ├── app/                     # (currently empty — becomes: providers composition, routes config)
│   │   ├── providers/           # AppProviders.jsx (Query+Auth+Theme+i18n+ErrorBoundary composed)
│   │   └── routes/              # route config (or keep at src/routes/, see below)
│   ├── assets/
│   ├── components/
│   │   ├── ui/                  # Button, Input, Card, Modal, Drawer, Badge, Loader, Skeleton, SegmentedControl
│   │   └── common/               # Navbar, Sidebar, Footer, BottomNav, FarmPickerSheet (app chrome)
│   ├── components/widgets/      # WeatherCard, ForecastCard, ChartCard, MapCard, AlertCard, RecommendationCard, ReportCard
│   ├── constants/                # routes.js, queryKeys namespaces, breakpoints, api endpoints map
│   ├── context/                  # AuthContext (exists), FarmContext, ThemeContext
│   ├── features/
│   │   ├── auth/                 # exists
│   │   ├── farms/                # exists
│   │   ├── weather/               # new — api/hooks/components/pages
│   │   ├── satellite/             # new
│   │   ├── ai/                    # new
│   │   ├── analytics/             # new
│   │   └── reports/                # new
│   ├── hooks/                    # cross-feature hooks (useMediaQuery, useDebounce, etc.)
│   ├── i18n/                     # exists
│   ├── layouts/                  # PublicLayout, AuthLayout, DashboardLayout (exist)
│   ├── lib/                      # axios.js (exists), queryClient.js
│   ├── pages/                    # top-level pages not tied to a feature (Landing, 404, Dashboard shell)
│   ├── routes/                   # ProtectedRoute, PublicOnlyRoute (exist) + route config
│   ├── utils/                    # formatting, validation helpers
│   ├── index.css                 # global styles + @theme tokens (to be aligned to prototype)
│   ├── App.jsx
│   └── main.jsx
├── index.html
├── package.json
└── vite.config.js
```

---

## Summary — what happens next (pending your approval)

1. Confirm: **adopt existing frontend as base** vs. start fresh (recommended: adopt).
2. Confirm: **stay on Tailwind v4** CSS-first theme (recommended, already installed) vs. migrate
   to v3 `tailwind.config.js`.
3. Confirm: **flatten `/farms` routing** to match your requested flat route list (recommended).
4. Confirm: replace existing brand/soil tokens with the **prototype's forest/leaf/harvest/warm-white
   palette + Fraunces/Public Sans/IBM Plex Mono fonts** (required to match the approved UI).

Once approved, I'll generate the foundation **one file at a time**, per your instructions —
starting with folder scaffolding, then Tailwind/theme config, then global styles, then providers,
then routing, then the API/query layer, then component-library folder stubs — stopping after each
file for your review.