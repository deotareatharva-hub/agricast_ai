import { forwardRef } from "react";

// Every button/CTA in the app (whether it's a real <button> or a styled
// <Link>) reads its classes from here - components/ui/Button for real
// buttons, and buttonClasses() for anywhere a <Link> needs to look like one.
// Props/behavior unchanged in this redesign; only the visual language did.
const VARIANT_CLASSES = {
  primary:
    "bg-gradient-to-b from-brand-500 to-brand-600 text-white shadow-[0_1px_0_0_rgb(255_255_255/0.15)_inset,0_6px_16px_-4px_rgb(22_163_74/0.45)] hover:from-brand-600 hover:to-brand-700 hover:shadow-[0_1px_0_0_rgb(255_255_255/0.15)_inset,0_8px_20px_-4px_rgb(22_163_74/0.55)] active:scale-[0.98]",
  secondary:
    "bg-neutral-900/[0.04] text-neutral-700 hover:bg-neutral-900/[0.07] active:scale-[0.98]",
  outline:
    "border border-neutral-200 bg-white/60 text-neutral-700 backdrop-blur hover:border-brand-300 hover:bg-white hover:text-brand-700 active:scale-[0.98]",
  danger:
    "bg-gradient-to-b from-red-500 to-red-600 text-white shadow-[0_1px_0_0_rgb(255_255_255/0.15)_inset,0_6px_16px_-4px_rgb(220_38_38/0.45)] hover:from-red-600 hover:to-red-700 active:scale-[0.98]",
  dangerOutline:
    "border border-red-200 text-red-600 hover:bg-red-50 active:scale-[0.98]",
  ghost: "text-neutral-600 hover:bg-neutral-900/[0.05] hover:text-brand-700 active:scale-[0.98]",
};

const SIZE_CLASSES = {
  sm: "px-3.5 py-1.5 text-sm",
  md: "px-4.5 py-2.5 text-sm",
  lg: "px-6 py-3 text-[15px]",
};

export function buttonClasses({ variant = "primary", size = "md", fullWidth = false, className = "" } = {}) {
  return [
    "focus-ring inline-flex items-center justify-center gap-2 rounded-full font-semibold tracking-[-0.01em] transition-all duration-200 ease-out disabled:cursor-not-allowed disabled:opacity-60 disabled:active:scale-100",
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
