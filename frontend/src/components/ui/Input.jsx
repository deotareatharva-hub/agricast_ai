import { forwardRef } from "react";

const BASE_CLASSES =
  "focus-ring block w-full rounded-xl border border-neutral-200 bg-white/70 px-3.5 py-2.5 text-sm text-neutral-900 shadow-[var(--shadow-soft-sm)] transition-colors placeholder:text-neutral-400 hover:border-neutral-300 disabled:cursor-not-allowed disabled:bg-neutral-50 disabled:text-neutral-400";

// forwardRef is required here, not optional - react-hook-form's
// {...register(name)} spreads a ref onto whatever it's attached to.
const Input = forwardRef(function Input({ className = "", invalid = false, ...props }, ref) {
  return (
    <input
      ref={ref}
      className={`${BASE_CLASSES} ${invalid ? "border-red-400 focus-visible:ring-red-400" : ""} ${className}`}
      aria-invalid={invalid || undefined}
      {...props}
    />
  );
});

export default Input;
