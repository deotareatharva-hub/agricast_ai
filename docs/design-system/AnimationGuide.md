# Animation Guide

(Complements `MotionGuide.md`, which covers Framer Motion component
patterns. This file covers CSS-level animation utilities in `index.css`.)

## `.animate-shimmer`
Used by `Skeleton.jsx` for loading placeholders:
```css
@keyframes shimmer { 0% { background-position: -400px 0; } 100% { background-position: 400px 0; } }
.animate-shimmer { background: linear-gradient(90deg, surface-3, #e6ebf2, surface-3); background-size: 800px 100%; animation: shimmer 1.6s linear infinite; }
```
Replaces the old flat `animate-pulse` skeletons with a directional sweep,
closer to Linear/Vercel-style loading states.

## Connectivity pulse
Dashboard's backend-health indicator uses a two-layer ping:
```jsx
<span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-brand-400 opacity-60" />
<span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-brand-500" />
```
(Tailwind's built-in `animate-ping`.) Communicates "live" without a chart.

## Spinner
`Loading.jsx` rotates a leaf icon continuously via Framer Motion
(`animate={{ rotate: 360 }}`, `duration: 1.4`, `ease: "linear"`) rather than
a CSS spinner, so its speed/easing stays consistent with the rest of the
motion system and easy to retune from one place.

## Where NOT to animate
Table/list rows beyond a light stagger-in; form validation errors (appear
instantly — delaying error feedback hurts usability); anything in a
loading skeleton besides the shimmer itself (nested motion inside a
skeleton reads as jittery, not premium).
