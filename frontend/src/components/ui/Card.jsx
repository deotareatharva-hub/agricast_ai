// The exact string "rounded-xl border border-neutral-200 bg-white p-5" (or
// p-6) appeared in six different files. Padding is the one axis those
// call sites actually disagreed on, so it's the one prop exposed - every
// other visual property (radius, border, background) stays fixed so the
// app keeps one consistent card look.
const PADDING_CLASSES = {
  none: "",
  sm: "p-4",
  md: "p-5",
  lg: "p-6",
};

export default function Card({ padding = "md", interactive = false, className = "", children, ...props }) {
  return (
    <div
      className={[
        "rounded-xl border border-neutral-200 bg-white",
        PADDING_CLASSES[padding] ?? PADDING_CLASSES.md,
        interactive && "transition hover:border-brand-300 hover:shadow-sm",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
      {...props}
    >
      {children}
    </div>
  );
}
