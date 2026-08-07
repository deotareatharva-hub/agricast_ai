# Motion Guide

All motion uses **Framer Motion** (already a dependency — no new package
added). Durations stay short (0.15–0.4s) with an "ease-out" feel so the UI
reads as responsive, not sluggish.

## Standard easing / duration
```js
transition={{ duration: 0.2–0.35, ease: [0.16, 1, 0.3, 1] }}
```
This cubic-bezier ("expo-out"-ish) is reused everywhere for consistency —
page transitions, card entrances, modal/drawer open.

## Patterns used in this codebase

**Page transition** (`DashboardLayout`)
```jsx
<AnimatePresence mode="wait">
  <motion.div key={location.pathname} initial={{opacity:0,y:8}} animate={{opacity:1,y:0}} exit={{opacity:0,y:-8}}>
    <Outlet />
  </motion.div>
</AnimatePresence>
```

**Active nav indicator** (Sidebar, FarmWorkspaceLayout tabs, LayerSelector,
unit toggle) — a single shared element that slides between positions via
`layoutId`:
```jsx
{isActive && <motion.span layoutId="sidebar-active-pill" transition={{type:"spring", stiffness:500, damping:40}} />}
```

**Staggered list/grid entrance** (Dashboard stat row, farm grid)
```jsx
const containerVariants = { hidden: {}, show: { transition: { staggerChildren: 0.06 } } };
const itemVariants = { hidden: { opacity: 0, y: 10 }, show: { opacity: 1, y: 0 } };
```

**Hover lift** (Card, StatCard, FarmCard)
```jsx
<motion.div whileHover={{ y: -3 }} transition={{ duration: 0.2 }}>
```

**Modal / Drawer open-close** — scale+fade for Modal, slide-in for Drawer,
both via `AnimatePresence` so exit animations play (unlike the previous
`if (!open) return null` pattern, which had no exit transition).

**Loading spinner** — a single rotating leaf glyph (`Loading.jsx`) instead
of a generic spinner, used everywhere a route/query is in flight.

**Confidence meter fill** (AI Advisory) — animates width from 0 → value on
mount, so the number feels "computed" rather than static.

## What we deliberately avoided
No parallax, no scroll-jacking, no animated background particles — the
audience skews toward quick task completion (checking weather, generating
a report) rather than a marketing-site browsing experience.
