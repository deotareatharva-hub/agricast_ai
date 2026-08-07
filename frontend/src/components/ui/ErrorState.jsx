import { useTranslation } from "react-i18next";
import { AlertTriangle } from "lucide-react";

// Replaces every hand-written server/query error block across the app.
export default function ErrorState({ message, onRetry, className = "" }) {
  const { t } = useTranslation();

  return (
    <div
      className={`flex items-center justify-between gap-3 rounded-xl border border-red-100 bg-red-50/80 px-4 py-3 text-sm text-red-700 ${className}`}
      role="alert"
    >
      <span className="flex items-center gap-2">
        <AlertTriangle className="h-4 w-4 shrink-0" aria-hidden="true" />
        {message || t("common.somethingWentWrong")}
      </span>
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="focus-ring shrink-0 rounded-full bg-red-100 px-3 py-1 text-xs font-semibold hover:bg-red-200"
        >
          {t("common.retry")}
        </button>
      )}
    </div>
  );
}
