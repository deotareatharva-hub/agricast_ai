# AgriCast AI — Frontend Audit

Scope: `agricast/frontend` as delivered in the backend+frontend bundle (React 19 + Vite + Tailwind v4). 44 source files: auth, routing, layouts, i18n, and a fully built Farms feature (list/detail/add/edit).

## Strengths

- **API layer discipline is genuinely good.** `lib/axios.js` is the single axios instance; `features/*/api/*.api.js` are the only files that call it. No component or hook ever imports axios directly. This is the pattern the rest of the app should have followed.
- **Query-key factory pattern** (`features/farms/hooks/farmKeys.js`) is correct and consistently used by all five farm hooks (`useFarms`, `useFarm`, `useCreateFarm`, `useUpdateFarm`, `useDeleteFarm`) for cache reads/invalidation.
- **Feature-based folder structure** is already in place and was not fighting the brief — `features/farms/{api,components,hooks,pages,validation}` is a clean, repeatable shape for Weather/Satellite/AI/Analytics/Reports to follow.
- **i18n coverage is real**, not decorative — every user-facing string in Login/Register/Farms/Dashboard goes through `t()`, across three locales (en/hi/mr).
- **Auth guarding** (`ProtectedRoute` / `PublicOnlyRoute`) correctly handles the `isInitializing` race so a logged-in user isn't flashed the login page on refresh.

## Duplicate Code

- The **label → input → error-paragraph** block was hand-written independently in `LoginPage`, `RegisterPage`, and `FarmForm` — same three-line Tailwind string repeated roughly 15 times across those three files.
- **Card surface** (`rounded-xl border border-neutral-200 bg-white p-5`) was retyped in `FarmCard`, `DashboardPage` (×2), `FarmDetailsPage` (×1), `AddFarmPage`/`EditFarmPage` (as `p-6`), and mirrored again inside `FarmListSkeleton`'s pulse cards.
- **Button/CTA classes** existed in at least four slightly-different hand-written variants (`Navbar` logout button, `Navbar` register link, `LandingPage` CTA, `MyFarmsPage`/`EmptyState`/`FarmDetailsPage` action buttons) — same visual language, no shared source.
- **The inline error banner** (`rounded-md bg-red-50 px-3 py-2 text-sm text-red-700`) appeared in `LoginPage`, `RegisterPage`, `FarmForm`, `MyFarmsPage`, `EditFarmPage`, and `FarmDetailsPage`.
- `ConfirmDialog` lived only inside `features/farms/components/` despite having nothing farm-specific in it — any future feature needing a confirm dialog (deleting a report, cancelling an AI job) would have duplicated it rather than reused it.

## Unused Files

- None found dead in the sense of "never imported." `src/features/auth/components/` and `src/features/auth/hooks/` are empty directories — clearly scaffolded ahead of an auth feature that hasn't moved into the `features/` convention yet (auth still lives in `context/AuthContext.jsx` + `pages/Login|RegisterPage.jsx`). Left as-is; flagged as a naming/consistency note below.
- `chart.js` and `react-chartjs-2` are declared dependencies with zero current usage — reasonable, since they're clearly there for the future Analytics module, not dead weight to remove.

## Architecture Problems

- **Auth state didn't resync on session expiry.** The axios response interceptor cleared the stored token on a 401, but `AuthContext`'s `user` state is independent React state — it had no way to learn a 401 happened. A user whose token expired mid-session would keep seeing themselves as logged in (navbar, protected routes) until a full page reload. *Fixed this pass* via a small pub/sub (`onUnauthorized`) that `AuthContext` subscribes to.
- **No error boundary anywhere**, despite the original context doc listing "Error Boundary" under required Providers. Any render-time exception in any page took the whole app down to a blank white screen with no recovery path.
- **No shared design-system layer.** `components/common/` held only page-shell components (Navbar/Sidebar/Footer/Loading/LanguageSwitcher) — every visual primitive (button, input, card, dialog) was reinvented per-feature. This is the root cause of most items in "Duplicate Code" above.

## Performance Problems

- **Every route was statically imported** in `App.jsx`. A first-time visitor to `/` downloaded the JS for Login, Register, Dashboard, and the entire Farms feature (including react-leaflet + Leaflet's CSS/marker assets) before seeing the landing page.
- **Farm search/crop filters fired a network request on every keystroke.** `MyFarmsPage` passed `{ search, crop }` straight into `useFarms(filters)`; each keypress produced a new TanStack Query cache key and a new request. No debounce existed anywhere in the app.

## Accessibility Problems

- **`prefers-reduced-motion` was not respected anywhere** — `animate-spin` (Loading) and `animate-pulse` (skeletons) ran unconditionally regardless of the OS setting, despite the context doc listing "Reduced Motion Support" as a requirement.
- `ConfirmDialog` had no Escape-to-close and no scroll lock on the page behind it — a keyboard user had to tab to the Cancel button specifically; there was no quick-dismiss path.

## Responsive Problems

- **This is the most significant gap found.** `Sidebar` was `hidden md:block` with *no mobile equivalent at all*. Below the `md` breakpoint, an authenticated user had no visible way to navigate to `/dashboard/farms` — the only path was typing the URL directly. Given the brief's explicit "Mobile First" requirement for farmers using phones, this made the Farms feature effectively unreachable on the primary target device.

## Component Problems

- `ConfirmDialog` was scoped inside `features/farms/` even though delete/confirm flows are a cross-cutting concern, not a farms concept.
- `FieldError` in `FarmForm.jsx` was a tiny local component duplicating what `LoginPage`/`RegisterPage` did inline with a bare `{errors.x && <p>...}` — three different shapes for the same idea in the same codebase.

## Maintainability Problems

- No path alias existed — every cross-folder import was a relative `../../../` chain. Fine at the current file count, but each new feature module (Weather, Satellite, AI, Analytics, Reports) adds another layer of `../` chains that get harder to read and easier to break during a file move.
- No barrel export for shared components, so consuming multiple primitives meant multiple import lines pointing at slightly different relative depths depending on where the importing file lives.

## Potential Improvements (addressed this pass — see RefactorSummary.md)

1. Extract a small shared UI layer (`components/ui/`) and migrate the duplicated markup onto it.
2. Fix the auth/401 state desync.
3. Add an app-level error boundary.
4. Lazy-load routes.
5. Debounce the farms search/filter inputs.
6. Add a mobile nav drawer so the dashboard is actually usable on a phone.
7. Add a `@/` path alias.
8. Respect `prefers-reduced-motion` globally.

## Not addressed (intentionally, per scope)

- Weather / Satellite / AI / Analytics / Reports pages — explicitly out of scope for this pass.
- TargetCursor / TextLoop / GooeyNav / Ferrofluid — explicitly deferred; not wired in.
- The `features/auth/{components,hooks}` empty scaffold — left alone rather than guessing at a restructure that wasn't asked for.
