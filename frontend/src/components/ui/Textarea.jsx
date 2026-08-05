import { forwardRef } from "react";

const BASE_CLASSES =
  "focus-ring block w-full rounded-md border border-neutral-300 px-3 py-2 text-sm disabled:cursor-not-allowed disabled:bg-neutral-50 disabled:text-neutral-400";

const Textarea = forwardRef(function Textarea({ className = "", invalid = false, rows = 4, ...props }, ref) {
  return (
    <textarea
      ref={ref}
      rows={rows}
      className={`${BASE_CLASSES} ${invalid ? "border-red-400" : ""} ${className}`}
      aria-invalid={invalid || undefined}
      {...props}
    />
  );
});

export default Textarea;
