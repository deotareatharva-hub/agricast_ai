import { AlertTriangle } from "lucide-react";

export default function ErrorState({ message, onRetry, retryLabel = "Try again" }) {
  return (
    <div className="rounded-2xl border border-red-100 bg-red-50/70 px-5 py-8 text-center backdrop-blur-sm">
      <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-xl bg-red-100 text-red-600">
        <AlertTriangle className="h-5 w-5" aria-hidden="true" />
      </div>
      <p className="mt-3 text-sm font-medium text-red-700">{message}</p>
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="focus-ring mt-4 rounded-full bg-white px-4 py-2 text-sm font-semibold text-red-700 shadow-[var(--shadow-soft-sm)] hover:bg-red-50"
        >
          {retryLabel}
        </button>
      )}
    </div>
  );
}
