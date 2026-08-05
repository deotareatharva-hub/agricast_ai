import { forwardRef } from "react";

const BASE_CLASSES =
  "focus-ring rounded-md border border-neutral-300 bg-white px-2 py-2 text-sm disabled:cursor-not-allowed disabled:bg-neutral-50 disabled:text-neutral-400";

const Select = forwardRef(function Select({ className = "", children, ...props }, ref) {
  return (
    <select ref={ref} className={`${BASE_CLASSES} ${className}`} {...props}>
      {children}
    </select>
  );
});

export default Select;
