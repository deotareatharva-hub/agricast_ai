import { forwardRef } from "react";

// Every button/CTA in the app (whether it's a real <button> or a styled
// <Link>) was hand-writing its own Tailwind string before this refactor -
// see FrontendAudit.md. This is the single source of truth for those
// classes now: components/ui/Button for real buttons, and buttonClasses()
// for anywhere a <Link> needs to look like one (e.g. "Add Farm").
const VARIANT_CLASSES = {
  primary: "bg-brand-600 text-white hover:bg-brand-700",
  secondary: "bg-neutral-100 text-neutral-700 hover:bg-neutral-200",
  outline: "border border-neutral-300 text-neutral-700 hover:bg-neutral-50",
  danger: "bg-red-600 text-white hover:bg-red-700",
  dangerOutline: "border border-red-200 text-red-600 hover:bg-red-50",
  ghost: "text-neutral-700 hover:text-brand-700",
};

const SIZE_CLASSES = {
  sm: "px-3 py-1.5 text-sm",
  md: "px-4 py-2 text-sm",
  lg: "px-5 py-3 text-sm",
};

export function buttonClasses({ variant = "primary", size = "md", fullWidth = false, className = "" } = {}) {
  return [
    "focus-ring inline-flex items-center justify-center gap-2 rounded-md font-semibold transition disabled:cursor-not-allowed disabled:opacity-60",
    VARIANT_CLASSES[variant] || VARIANT_CLASSES.primary,
    SIZE_CLASSES[size] || SIZE_CLASSES.md,
    fullWidth ? "w-full" : "w-fit",
    className,
  ]
    .filter(Boolean)
    .join(" ");
}

function Spinner() {
  return (
    <span
      className="h-4 w-4 shrink-0 animate-spin rounded-full border-2 border-white/40 border-t-white"
      aria-hidden="true"
    />
  );
}

// type="button" by default - forms opt into type="submit" explicitly so a
// stray <Button> inside a form never accidentally submits it.
const Button = forwardRef(function Button(
  { variant = "primary", size = "md", fullWidth = false, isLoading = false, className = "", children, type = "button", disabled, ...props },
  ref
) {
  return (
    <button
      ref={ref}
      type={type}
      disabled={disabled || isLoading}
      className={buttonClasses({ variant, size, fullWidth, className })}
      {...props}
    >
      {isLoading && <Spinner />}
      {children}
    </button>
  );
});

export default Button;
