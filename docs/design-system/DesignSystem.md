# AgriCast AI — Design System

## What changed, and what didn't
This redesign touches **frontend presentation only**. No backend route, API
contract, business logic, or auth flow was modified. Every screen's data
still flows through the same hooks (`useFarms`, `useCurrentWeather`,
`useLatestRecommendation`, etc.) — only the components that render that data
were rebuilt.

Two things were deliberately **not** invented:
- **Fake data.** Where a real hook/endpoint didn't exist (e.g. a global
  "today's weather" widget on the main Dashboard, which has no farm
  context), the design shows an honest empty/loading state instead of a
  fabricated number.
- **Fake functionality.** The topbar's search box and notification bell are
  real UI, but the notification panel says "you're all caught up" rather
  than pretending there's a live feed the backend doesn't provide.

## Design principles
1. **Calm confidence, not clutter.** Generous spacing, one accent per
   screen region, soft shadows instead of hard borders.
2. **Legible first.** Farmers using this app may have limited technical
   background — large type, plain language, obvious primary actions.
3. **Motion with purpose.** Framer Motion is used for orientation (page
   transitions, active-tab indicators) and feedback (button press, loading
   spinners) — never decoration for its own sake.
4. **One system, everywhere.** Every screen is built from the same ~15
   primitives in `src/components/ui/`. Changing a token in `index.css`
   changes the whole app.

## Structure
- `src/index.css` — design tokens (color, radius, shadow, surfaces)
- `src/components/ui/` — Button, Card, Badge, Input, Select, Textarea,
  Field, Modal, Dialog, Drawer, EmptyState, ErrorState, PageHeader,
  Skeleton, StatCard, Avatar, Breadcrumb
- `src/components/common/` — Sidebar, DashboardTopbar, Loading, ErrorState
  (app-shell level, not reusable primitives)
- `src/layouts/` — DashboardLayout (shell), FarmWorkspaceLayout (per-farm
  tab shell)
- Feature folders (`src/features/*`) — page-level composition using the
  primitives above; business logic (hooks, api, validation) untouched

See `ColorTokens.md`, `TypographyGuide.md`, `ComponentGuide.md`,
`MotionGuide.md`, `ThemeGuide.md`, `AnimationGuide.md`, `UIArchitecture.md`
for details on each layer.
