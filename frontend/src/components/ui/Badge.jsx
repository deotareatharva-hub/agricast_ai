const VARIANT_CLASSES = {
  brand: "bg-brand-50 text-brand-700 ring-1 ring-inset ring-brand-600/10",
  neutral: "bg-neutral-100 text-neutral-600 ring-1 ring-inset ring-neutral-900/5",
  warn: "bg-amber-50 text-amber-700 ring-1 ring-inset ring-amber-600/15",
  danger: "bg-red-50 text-red-700 ring-1 ring-inset ring-red-600/10",
  info: "bg-info-50 text-info-600 ring-1 ring-inset ring-info-600/10",
};

export default function Badge({ variant = "brand", className = "", children }) {
  return (
    <span
      className={`inline-flex shrink-0 items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold ${
        VARIANT_CLASSES[variant] || VARIANT_CLASSES.brand
      } ${className}`}
    >
      {children}
    </span>
  );
}
