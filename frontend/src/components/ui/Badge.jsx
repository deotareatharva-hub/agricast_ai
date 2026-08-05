const VARIANT_CLASSES = {
  brand: "bg-brand-50 text-brand-700",
  neutral: "bg-neutral-100 text-neutral-600",
  warn: "bg-amber-50 text-amber-700",
  danger: "bg-red-50 text-red-700",
};

export default function Badge({ variant = "brand", className = "", children }) {
  return (
    <span
      className={`inline-flex shrink-0 items-center rounded-full px-2.5 py-1 text-xs font-medium ${
        VARIANT_CLASSES[variant] || VARIANT_CLASSES.brand
      } ${className}`}
    >
      {children}
    </span>
  );
}
