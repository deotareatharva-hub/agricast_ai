// Every text field across the app repeats the same "label -> control ->
// error paragraph" block. Field owns that structure; callers just pass the
// control (Input/Select/Textarea) as children.
export default function Field({ label, htmlFor, error, hint, className = "", children }) {
  return (
    <div className={className}>
      {label && (
        <label htmlFor={htmlFor} className="block text-sm font-medium text-neutral-700">
          {label}
        </label>
      )}
      <div className={label ? "mt-1.5" : undefined}>{children}</div>
      {error ? (
        <p className="mt-1.5 text-xs font-medium text-red-600">{error.message}</p>
      ) : (
        hint && <p className="mt-1.5 text-xs text-neutral-400">{hint}</p>
      )}
    </div>
  );
}
