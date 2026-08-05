import { CloudOff } from "lucide-react";
import { useTranslation } from "react-i18next";
import Button from "../../../components/ui/Button";

// The shared components/ui/ErrorState.jsx is an inline alert strip,
// deliberately reused for form/query errors elsewhere. A full weather
// panel failing to load is a bigger moment on the page, so this gets its
// own card treatment while still using Button for the retry action -
// same visual language as the rest of the app, just more room to breathe.
export default function WeatherErrorState({ message, onRetry, className = "" }) {
  const { t } = useTranslation();

  return (
    <div
      role="alert"
      className={`flex flex-col items-center gap-3 rounded-2xl border border-neutral-200 bg-white px-6 py-14 text-center ${className}`}
    >
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-50 text-danger-500">
        <CloudOff className="h-6 w-6" aria-hidden="true" />
      </div>
      <div>
        <h3 className="text-sm font-semibold text-neutral-900">{t("weather.errors.title")}</h3>
        <p className="mt-1 max-w-sm text-sm text-neutral-500">
          {message || t("weather.errors.generic")}
        </p>
      </div>
      {onRetry && (
        <Button variant="outline" size="sm" onClick={onRetry}>
          {t("common.retry")}
        </Button>
      )}
    </div>
  );
}
