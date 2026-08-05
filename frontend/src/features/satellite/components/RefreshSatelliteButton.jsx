import { useTranslation } from "react-i18next";
import { RefreshCw, CheckCircle, AlertCircle } from "lucide-react";
import { useRefreshSatellite } from "../hooks/useRefreshSatellite";

export default function RefreshSatelliteButton({ farmId, className = "" }) {
  const { t } = useTranslation();
  const { mutate, isPending, isSuccess, isError, reset } = useRefreshSatellite(farmId);

  const handleRefresh = () => {
    reset();
    mutate();
  };

  return (
    <div className={`flex flex-col items-start gap-1 ${className}`}>
      <button
        onClick={handleRefresh}
        disabled={isPending || !farmId}
        className="flex items-center gap-2 rounded-xl border border-brand-200 bg-brand-50 px-4 py-2 text-sm font-medium text-brand-700 transition hover:bg-brand-100 disabled:cursor-not-allowed disabled:opacity-60"
      >
        <RefreshCw
          className={`h-4 w-4 ${isPending ? "animate-spin" : ""}`}
          aria-hidden="true"
        />
        {isPending
          ? t("satellite.actions.refreshing")
          : t("satellite.actions.refresh")}
      </button>

      {isSuccess && (
        <p className="flex items-center gap-1 text-xs text-green-600">
          <CheckCircle className="h-3 w-3" />
          {t("satellite.actions.refreshSuccess")}
        </p>
      )}
      {isError && (
        <p className="flex items-center gap-1 text-xs text-red-500">
          <AlertCircle className="h-3 w-3" />
          {t("satellite.actions.refreshError")}
        </p>
      )}
    </div>
  );
}
