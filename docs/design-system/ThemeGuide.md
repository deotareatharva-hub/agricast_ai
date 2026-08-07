# Theme Guide

## Light mode (default, fully implemented)
The entire redesign targets light mode: `surface-2` (#F6F8FB) page
background with soft radial brand/info tints, `surface-0` white cards,
neutral-900 text. This matches the brief's background/card spec exactly.

## Dark mode (scaffolded, not fully wired)
`src/index.css` declares a dark variant hook:
```css
@custom-variant dark (&:where(.dark, .dark *));
```
`surface-glass-dark` exists as a token-level building block. However, **no
page component currently applies `dark:` variants** — none were added in
this pass, because doing so thoroughly (every card, every text color, every
border) across ~90 files without visual QA access risked shipping
inconsistent contrast. Treat dark mode as ready-for-implementation
scaffolding, not a shipped feature: the tokens exist, the toggle mechanism
(a `dark` class on `<html>`) is standard Tailwind v4 and can be added via a
small `useState` + `localStorage` hook plus a switch in Settings.

## Recommended next step for full dark mode
1. Add a `themeMode` field to `useSettings` (already the pattern used for
   `units`/`notifications`) — no backend change needed, same localStorage
   approach.
2. Toggle a `dark` class on `<html>` from that setting.
3. Add `dark:bg-neutral-900 dark:text-neutral-100` (etc.) incrementally,
   starting with the shell (Sidebar/Topbar/DashboardLayout) since those
   wrap everything.

## Brand theme
Only one color theme ships (Forest Green) — this matches the current
Settings page, which shows theme as a read-only badge ("Forest Green, the
AgriCast AI default theme") rather than a picker, since the backend/settings
model doesn't yet support multiple themes.
