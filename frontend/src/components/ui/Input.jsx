import { forwardRef } from "react";

const BASE_CLASSES =
  "focus-ring block w-full rounded-md border border-neutral-300 px-3 py-2 text-sm disabled:cursor-not-allowed disabled:bg-neutral-50 disabled:text-neutral-400";

// forwardRef is required here, not optional - react-hook-form's
// {...register(name)} spreads a ref onto whatever it's attached to, and a
// plain functional component would silently drop it and break validation.
const Input = forwardRef(function Input({ className = "", invalid = false, ...props }, ref) {
  return (
    <input
      ref={ref}
      className={`${BASE_CLASSES} ${invalid ? "border-red-400" : ""} ${className}`}
      aria-invalid={invalid || undefined}
      {...props}
    />
  );
});

export default Input;
