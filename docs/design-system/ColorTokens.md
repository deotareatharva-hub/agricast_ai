# Color Tokens

Defined in `src/index.css` under `@theme`. Tailwind v4 turns each
`--color-*` variable into a matching utility class automatically
(e.g. `--color-brand-600` → `bg-brand-600`, `text-brand-600`, `border-brand-600`).

## Brand (primary)
Deep forest green → live emerald. Used for primary actions, active states,
the hero gradient, and the logo mark.

| Token | Hex | Typical use |
|---|---|---|
| `brand-50`  | `#f0fdf4` | active-pill backgrounds |
| `brand-100` | `#dcfce7` | subtle tints |
| `brand-500` | `#22c55e` | mid accents |
| `brand-600` | `#16a34a` | primary buttons, links |
| `brand-700` | `#166534` | active nav text |
| `brand-800` | `#14532d` | hero gradient start |
| `brand-950` | `#082614` | deepest shade |

## Accent
`accent-100`–`accent-600` (lime family) — used sparingly inside gradients
(e.g. hero background, active pills) for a "living leaf" highlight next to
brand green.

## Semantic
| Purpose | Token family | Notes |
|---|---|---|
| Warning / medium risk | `amber-*` | disease-risk "Medium", unit toggles are neutral, alerts |
| Orange highlight | `orange-*` | reserved accent, not heavily used yet |
| Info / links / rain | `info-*` (blue) | rain probability, backend health "info" tone |
| Success | `brand-*` | re-uses brand green rather than a separate success scale |
| Danger | `danger-500` (`#c0453a`) + Tailwind `red-*` | delete actions, disease-risk "High" |
| Existing legacy tones | `soil-*`, `sky-alert-*`, `warn-*` | kept from the original palette so any code still referencing them doesn't break |

## Surfaces
| Token | Use |
|---|---|
| `surface-0` `#ffffff` | cards |
| `surface-1` `#fbfcfe` | subtle off-white |
| `surface-2` `#f6f8fb` | app background |
| `surface-3` `#eef1f6` | skeleton/shimmer base |

## Utility classes built on these tokens
- `.surface-card` — white card, 1px hairline border, soft shadow
- `.surface-glass` / `.surface-glass-dark` — frosted glass (topbar, sidebar, modals, drawers)
- `.bg-gradient-hero` — brand-800 → brand-600 → emerald, used on hero banners
- `.text-gradient-brand` — gradient text for large numerals/headlines
- `.bg-noise-overlay` — subtle dot-grid texture layered over hero gradients
