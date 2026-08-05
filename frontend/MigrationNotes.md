# AgriCast AI — Migration Notes

For whoever builds the next module (Weather / Satellite / AI Advisory / Analytics / Reports) or wires in the premium effects.

## Adding a new feature module

Follow the exact shape `features/farms/` already uses — this refactor didn't change that structure, only made the leaf files (pages/components) thinner:

```
features/<name>/
  api/<name>.api.js        # only file that imports lib/axios
  hooks/<name>Keys.js       # query-key factory, mirrors farmKeys.js
  hooks/use<Name>.js, use<Name>s.js, useCreate<Name>.js, ...
  components/               # feature-specific components only
  pages/                    # route-level pages
  validation/               # RHF rule objects, mirrors farmSchema.js
```

Reach for `src/components/ui/*` before writing new markup:

- A list of cards → `Card` (+ `Badge` for tags/status)
- Any form field → `Field` + `Input`/`Select`/`Textarea`
- A page title with actions → `PageHeader` (with `Breadcrumb` if it's a detail view)
- Loading list → compose `Skeleton` into the target shape, the way `FarmListSkeleton` does
- Nothing to show → `EmptyState` with a relevant `lucide-react` icon
- A failed query → `ErrorState`, passing TanStack Query's `refetch` as `onRetry`
- Delete/confirm → `Dialog`; anything bigger/free-form → `Modal`
- A numeric widget (today's rainfall, AI confidence score, report count) → `StatCard`

Register the route in `src/App.jsx` as a `lazy()` import, same pattern as the existing farm pages. Add the nav entry to `DASHBOARD_NAV_ITEMS` in `src/components/common/DashboardNav.jsx` — that single list drives both the desktop `Sidebar` and the mobile `Drawer`, so you only add it once.

Add translation keys to all three locale files (`src/i18n/locales/{en,hi,mr}/translation.json`) under a new top-level section named after the feature, same as `farms`.

## Premium effects (TargetCursor, TextLoop, GooeyNav, Ferrofluid)

Deliberately not integrated this pass — the current task was refactor-only. When they're wired in:

- **`framer-motion` is not yet in `package.json`.** It's an approved stack item per the original context doc but nothing in the codebase uses it yet, so it wasn't added speculatively. Add it when the first effect that needs it lands.
- **`useIsDesktop()`** (in `src/hooks/useMediaQuery.js`) is the hook to gate TargetCursor and the desktop `GooeyNav` variant — both are specified as desktop-only with automatic disable on touch devices. `Drawer` already covers the "GooeyNav → standard drawer on mobile" requirement; the mobile nav in `DashboardLayout` can be treated as that fallback, or `PublicLayout`/`Navbar` can grow its own `Drawer` instance for the landing page's mobile nav using the exact same pattern.
- Build each effect as a wrapper component (e.g. `components/effects/TargetCursor.jsx`) that renders `children` unchanged when `useIsDesktop()` is false or `prefers-reduced-motion` is set — the reduced-motion CSS rule in `index.css` handles CSS-driven animation, but a JS-driven effect (cursor tracking, ferrofluid canvas) needs its own check via `window.matchMedia("(prefers-reduced-motion: reduce)")`.
- Ferrofluid backgrounds (Login/Register/404/AI loading) should sit behind `AuthLayout`'s existing centered card — check contrast against the card's `bg-white` before shipping; the brief calls for "subtle" opacity specifically so form text stays readable.

## Known follow-ups not addressed this pass

- `src/features/auth/{components,hooks}/` are empty directories, scaffolded for auth to eventually move into the same `features/` shape as farms (currently auth logic lives in `context/AuthContext.jsx` + top-level `pages/Login|RegisterPage.jsx`). Nobody asked for that move yet — flagged in the audit, not done speculatively.
- `chart.js` / `react-chartjs-2` are installed but unused — first real consumer will likely be the Analytics module.
- No automated tests exist anywhere in the frontend. Not in scope for this pass, but worth flagging before the app gets much bigger.

## Verification you should run locally

This environment has no network access, so the following could not be run and should be your first step after pulling this:

```bash
npm install     # will also refresh package-lock.json for the lucide-react addition
npm run build   # confirms the Vite/Tailwind build succeeds
npm run dev     # smoke-test: landing → register → login → dashboard → farms CRUD → resize to mobile and open the drawer
```
