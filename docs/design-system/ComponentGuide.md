# Component Guide

All primitives live in `src/components/ui/`. Props are intentionally small
and stable so existing call sites (register(), onClick handlers, react-hook-form
refs) kept working through the redesign.

## Button
```jsx
<Button variant="primary" size="md" isLoading={false} fullWidth={false}>Save</Button>
```
Variants: `primary` (gradient brand), `secondary`, `outline`, `danger`,
`dangerOutline`, `ghost`. Sizes: `sm` `md` `lg`.
For a `<Link>` that needs button styling, use `buttonClasses({ variant, size })`
instead of nesting a `<Button>` around a `<Link>` (invalid HTML — a link
can't contain a button).

## Card
```jsx
<Card padding="md" interactive glass={false}>...</Card>
```
`interactive` adds hover lift + border tint (use for clickable cards like
FarmCard). `glass` swaps the white surface for a frosted one (used in
Modal/Drawer, not typically in-page).

## Badge
```jsx
<Badge variant="brand|neutral|warn|danger|info">Label</Badge>
```

## Input / Textarea / Select
Drop-in replacements for native form controls, `forwardRef` so
`{...register("field")}` from react-hook-form works unchanged. Pass
`invalid` to switch to the red/error visual state.

## Field
Wraps a label + control + error/hint line. Pass the control (Input/Select/
Textarea) as `children`:
```jsx
<Field label="Farm name" htmlFor="farmName" error={errors.farmName}>
  <Input id="farmName" {...register("farmName")} />
</Field>
```

## Modal / Dialog / Drawer
- `Modal` — generic centered panel, owns overlay/escape/focus/scroll-lock.
- `Dialog` — confirm/cancel wrapper built on Modal (open/onClose/onConfirm/message).
- `Drawer` — slide-in panel from left or right, used for the mobile nav.

## EmptyState / ErrorState / Skeleton
Standard states for "nothing here yet", "something failed, with retry", and
loading shimmer. Every list/detail screen in the app uses one of these
three instead of a bespoke one-off.

## PageHeader / Breadcrumb
```jsx
<PageHeader
  title="My Farms"
  subtitle="..."
  breadcrumb={<Breadcrumb items={[{ label: "Farms", to: "/dashboard/farms" }, { label: "Add Farm" }]} />}
  actions={<Link className={buttonClasses()}>Add Farm</Link>}
/>
```

## StatCard
Compact metric tile (icon, label, big number, optional trend/hint) — used
on Dashboard, Profile, Analytics.

## Avatar
Renders a user photo if present, otherwise initials on a brand gradient.
