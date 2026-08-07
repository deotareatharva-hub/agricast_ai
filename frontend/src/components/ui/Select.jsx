import { forwardRef } from "react";
import { ChevronDown } from "lucide-react";

const BASE_CLASSES =
  "focus-ring w-full appearance-none rounded-xl border border-neutral-200 bg-white/70 px-3.5 py-2.5 pr-9 text-sm text-neutral-900 shadow-[var(--shadow-soft-sm)] transition-colors hover:border-neutral-300 disabled:cursor-not-allowed disabled:bg-neutral-50 disabled:text-neutral-400";

const Select = forwardRef(function Select({ className = "", children, ...props }, ref) {
  return (
    <span className="relative inline-block w-full">
      <select ref={ref} className={`${BASE_CLASSES} ${className}`} {...props}>
        {children}
      </select>
      <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" aria-hidden="true" />
    </span>
  );
});

export default Select;
