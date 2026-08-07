# Typography Guide

## Fonts
```css
--font-sans: "Inter", ui-sans-serif, system-ui, sans-serif;      /* body */
--font-display: "Space Grotesk", "Inter", ...;                    /* optional, large headlines */
--font-mono: "IBM Plex Mono", ui-monospace, ...;                  /* not currently used in UI copy */
```
`font-sans` is the default (set on `<body>`). `font-display` is opt-in via
`font-display` utility class for large hero numerals if a screen wants extra
personality — it is not required for compliance with this system.

> Note: the font files themselves aren't bundled in this pass (no `@font-face`
> added) — the stack falls back to system fonts (`ui-sans-serif`) until
> Inter/Space Grotesk are added via `<link>` or `@font-face`. This keeps the
> visual language ready without adding a new network dependency silently.

## Scale (Tailwind defaults, used consistently)
| Role | Class | Example |
|---|---|---|
| Page title | `text-2xl sm:text-3xl font-bold tracking-[-0.02em]` | `PageHeader` title |
| Hero title | `text-3xl sm:text-4xl font-bold tracking-[-0.02em]` | Dashboard hero |
| Section label | `text-xs font-bold uppercase tracking-wider text-neutral-400` | "Current conditions", "History" |
| Card title | `text-base font-semibold` | FarmCard, RecommendationCard summary |
| Body | `text-sm text-neutral-600` | descriptions, table cells |
| Caption / meta | `text-xs text-neutral-400` | timestamps, hints |
| Big numeral | `text-2xl sm:text-4xl font-bold tracking-[-0.02em]` | StatCard value, weather temperature |

## Rules of thumb
- Headings always get negative tracking (`tracking-[-0.01em]` to `-0.02em`) — this alone is most of the "premium" feel vs. default browser spacing.
- Section labels are uppercase + wide letter-spacing + `neutral-400`, never a full heading weight — they're wayfinding, not content.
- Body copy stays `text-sm`; nothing in the authenticated app drops to `text-xs` except captions/timestamps/badges.
