// The exact string "rounded-xl border border-neutral-200 bg-white p-5" (or
// p-6) appeared everywhere before this refactor. Padding is still the one
// axis exposed - every other visual property (radius, border, shadow) is
// fixed centrally so the app keeps one consistent, premium card look.
const PADDING_CLASSES = {
  none: "",
  sm: "p-4",
  md: "p-5 sm:p-6",
  lg: "p-6 sm:p-8",
};

export default function Card({ padding = "md", interactive = false, glass = false, className = "", children, ...props }) {
  return (
    <div
      className={[
        "rounded-2xl transition-all duration-300",
        glass ? "surface-glass" : "surface-card",
        PADDING_CLASSES[padding] ?? PADDING_CLASSES.md,
        interactive &&
          "cursor-pointer hover:-translate-y-0.5 hover:border-brand-200 hover:shadow-[var(--shadow-soft-lg)]",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
      style={{ boxShadow: className.includes("shadow-") ? undefined : "var(--shadow-soft-sm)" }}
      {...props}
    >
      {children}
    </div>
  );
}
