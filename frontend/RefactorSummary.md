# AgriCast AI — Refactor Summary

Nothing in this pass changes how the app *looks*. Every new shared component was built to reproduce the exact Tailwind classes the original markup used — this is a consolidation pass, not a redesign, per the brief. Files not listed below were left untouched.

## New: shared design system (`src/components/ui/`)

| File | Why it exists | Problem it solves |
|---|---|---|
| `Button.jsx` + `buttonClasses()` | Every button/CTA (real `<button>` or a styled `<Link>`) had its own hand-written variant of the same classes. | Removes ~6 near-duplicate button class strings; `buttonClasses()` lets a `<Link>` (e.g. "Add Farm") look identical to a real `<Button>` without copy-pasting Tailwind. |
| `Field.jsx` | Login/Register/FarmForm each hand-rolled "label → control → error paragraph." | One place owns that structure; a control (Input/Select) is passed as `children`. |
| `Input.jsx`, `Select.jsx`, `Textarea.jsx` | Text/select styling was retyped on every `<input>`/`<select>` tag (12+ occurrences). | `forwardRef` so `react-hook-form`'s `{...register()}` still works; one class string to maintain. `Textarea` isn't used yet — scaffolded so Reports/AI notes fields don't reinvent it. |
| `Card.jsx` | `rounded-xl border border-neutral-200 bg-white p-5` (or `p-6`) was retyped in six files. | One surface, with `padding` as the only prop exposed, since that was the one axis call sites actually disagreed on. |
| `Badge.jsx` | Farm area-unit pill had bespoke classes; no reusable "tag" existed. | Reusable status/metadata chip for this and future modules (weather alerts, AI confidence, etc). |
| `Avatar.jsx` | Navbar showed the user's name as plain text only. | Initials avatar next to the name — small polish, no new dependency. |
| `PageHeader.jsx` | Title/subtitle/actions header block duplicated across 5 pages. | One header component; optional `breadcrumb` slot so only pages that need one pay for it. |
| `Breadcrumb.jsx` | Farm detail/edit pages only had a plain "back to list" link; no shared breadcrumb existed. | Consistent wayfinding pattern for any future nested-detail page. |
| `Skeleton.jsx` | `FarmListSkeleton` hand-rolled `animate-pulse` divs. | Bare primitive; feature skeletons compose it into the right shape instead of duplicating the pulse styling. |
| `EmptyState.jsx` | Farms had its own empty-state card; nothing generic existed for other features. | Generic "nothing here" panel; `icon` accepts any `lucide-react` icon so Weather/Satellite/Reports get a relevant one without a new component. |
| `ErrorState.jsx` | The `bg-red-50 px-3 py-2 text-sm text-red-700` banner was retyped in 6 files. | Same exact visual footprint, now with an optional `onRetry` (wired to TanStack Query's `refetch` where it made sense). |
| `Modal.jsx` | No generic modal shell existed — `ConfirmDialog` was the only overlay, and it was farms-only. | Portal-based overlay with focus-on-open, Escape-to-close, and body-scroll lock (`Dialog` and any future free-form modal build on this). |
| `Dialog.jsx` | Confirm/delete flow (`ConfirmDialog`) lived only in `features/farms/`. | Same confirm-dialog behavior, generalized and moved into the shared layer so Reports/AI/etc. can reuse it instead of duplicating it. |
| `Drawer.jsx` | No mobile nav existed at all (see audit — "Responsive Problems"). | Slide-in panel with the same focus/Escape/scroll-lock treatment as `Modal`; used by `DashboardLayout` for mobile nav. |
| `StatCard.jsx` | DoD requirement; no numeric-stat widget existed. | First real usage is the farm count on `DashboardPage`; the shape Weather/Analytics widgets should reuse instead of a bespoke card. |
| `index.js` | — | Barrel export so feature code does one import instead of nine. |

## New: shared hooks (`src/hooks/`)

| File | Why |
|---|---|
| `useDisclosure.js` | `FarmDetailsPage`/`MyFarmsPage` each had their own `useState` + open/close callbacks for dialog visibility. Named once. |
| `useMediaQuery.js` (+`useIsDesktop`) | Needed by `DashboardLayout` to decide Sidebar vs. Drawer. Also the hook the deferred premium-effects wrappers (TargetCursor/GooeyNav) should use later to detect desktop-only viewports — see MigrationNotes.md. |
| `useDebouncedValue.js` | Fixes the keystroke-triggers-a-request problem in `MyFarmsPage`. |
| `useLockBodyScroll.js` | Shared by `Modal` and `Drawer` so the page behind either can't scroll while open (the old `ConfirmDialog` didn't lock scroll at all). |

## Modified: core app files

| File | Why it changed |
|---|---|
| `src/lib/axios.js` | Added a tiny pub/sub (`onUnauthorized`) so `AuthContext` can react when the interceptor clears an expired token — fixes the auth/state desync in the audit. |
| `src/context/AuthContext.jsx` | Subscribes to `onUnauthorized` and clears `user` in sync with the token. |
| `src/App.jsx` | Routes converted to `React.lazy` + `Suspense`; layouts stay eager since they render on nearly every route. Fixes the "everything ships on first load" performance problem. |
| `src/main.jsx` | Wrapped `<App />` in the new `ErrorBoundary`. |
| `src/index.css` | Added a `prefers-reduced-motion` media query so `animate-spin`/`animate-pulse` respect the OS setting app-wide. |
| `vite.config.js` | Added a `@` → `src` resolve alias. |
| `jsconfig.json` (new) | Mirrors the alias for editor IntelliSense (Vite/Rollup already resolve it at build time). |
| `package.json` | Added `lucide-react` (already an approved stack item per the context doc, was missing) — used for the new drawer/dialog/breadcrumb icons. `framer-motion` was deliberately **not** added yet; nothing in this pass uses it (see MigrationNotes.md). |

## Modified: layout / nav

| File | Why |
|---|---|
| `src/components/common/DashboardNav.jsx` (new) | Extracted the nav-link list out of `Sidebar` so the new mobile `Drawer` can render the identical list without drifting out of sync. |
| `src/components/common/Sidebar.jsx` | Now a thin wrapper around `DashboardNav`. Visually unchanged. |
| `src/layouts/DashboardLayout.jsx` | Adds a `md:hidden` bar with a menu button that opens `Drawer` + `DashboardNav` — this is the actual fix for the mobile-navigation gap. |
| `src/components/common/Navbar.jsx` | User name now shown next to an `Avatar`; logout/register buttons use `buttonClasses()` instead of hand-written classes. No visual change beyond the avatar. |
| `src/components/ErrorBoundary.jsx` (new) | Was specified in the original docs, never implemented. |

## Modified: pages

`LoginPage.jsx`, `RegisterPage.jsx` — every field converted to `Field` + `Input`; server error converted to `ErrorState`. Behavior unchanged.

`DashboardPage.jsx` — the two info cards now use `Card`; added a `StatCard` showing live farm count via the existing `useFarms()` hook (first real cross-feature usage, proves the widget pattern out for Weather/Analytics).

`LandingPage.jsx`, `NotFoundPage.jsx` — CTA buttons now use `buttonClasses()`.

## Modified: farms feature

`FarmCard.jsx` — now built on `Card` + `Badge`. `EmptyState.jsx` (farms) — now a thin wrapper around the shared `EmptyState`, owns only the copy and the "Add Farm" CTA. `FarmListSkeleton.jsx` — composes the shared `Skeleton` primitive. `FarmForm.jsx` — every field converted to `Field`/`Input`/`Select`; local `FieldError` component removed. `MyFarmsPage.jsx` — `PageHeader`, debounced search/crop filters, `ErrorState` with retry, `Dialog` instead of the farms-only `ConfirmDialog`. `AddFarmPage.jsx` / `EditFarmPage.jsx` — `PageHeader` + `Breadcrumb` + `Card`. `FarmDetailsPage.jsx` — `PageHeader` + `Breadcrumb`, delete confirmation now uses `Dialog` + `useDisclosure`.

**Removed:** `features/farms/components/ConfirmDialog.jsx` — superseded by `components/ui/Dialog.jsx`.

## Unchanged (verified, not touched)

`lib/axios.js`'s request/response shape, all five farm hooks, `farmKeys.js`, both `*.api.js` files, `LocationPicker.jsx`, `AuthLayout.jsx`, `PublicLayout.jsx`, `ProtectedRoute.jsx`, `PublicOnlyRoute.jsx`, `LanguageSwitcher.jsx`, `Footer.jsx`, `i18n/index.js`, all backend code.

## Verification performed

- Every `.js`/`.jsx` file (62 total) syntax-checked with `esbuild` — all pass.
- Every relative import in `src/` resolved to a real file/index via a path-resolution script — no broken imports.
- Every non-relative import cross-checked against `package.json` — no missing dependencies; only pre-existing unused deps (`chart.js`, `react-chartjs-2`, scaffolded for the future Analytics module) flagged, not removed.
- **Not performed:** an actual `npm install` / `vite build` / running the app in a browser — this environment has no network access. Run `npm install && npm run build` yourself as the final check before deploying.
