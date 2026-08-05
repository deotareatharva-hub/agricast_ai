import { useTranslation } from "react-i18next";
import { SatelliteDish } from "lucide-react";

export default function SatelliteError({ message, onRetry, className = "" }) {
  const { t } = useTranslation();

  return (
    <div
      role="alert"
      className={`flex flex-col items-center gap-3 rounded-2xl border border-neutral-200 bg-white px-6 py-14 text-center ${className}`}
    >
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-50 text-danger-500">
        <SatelliteDish className="h-6 w-6" aria-hidden="true" />
      </div>
      <div>
        <h3 className="text-sm font-semibold text-neutral-900">{t("satellite.errors.title")}</h3>
        <p className="mt-1 max-w-sm text-sm text-neutral-500">
          {message || t("satellite.errors.generic")}
        </p>
      </div>
      {onRetry && (
        <button
          onClick={onRetry}
          className="rounded-lg border border-neutral-200 bg-white px-4 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-50 transition"
        >
          {t("common.retry")}
        </button>
      )}
    </div>
  );
}
