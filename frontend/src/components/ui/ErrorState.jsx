import { useTranslation } from "react-i18next";

// Replaces every hand-written
// `<p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">`
// block (LoginPage/RegisterPage server errors, MyFarmsPage/EditFarmPage/
// FarmDetailsPage/DashboardPage query errors). Deliberately keeps that
// exact visual footprint rather than introducing a new "alert card" look -
// this refactor consolidates markup, it doesn't redesign it.
export default function ErrorState({ message, onRetry, className = "" }) {
  const { t } = useTranslation();

  return (
    <div
      className={`flex items-center justify-between gap-3 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700 ${className}`}
      role="alert"
    >
      <span>{message || t("common.somethingWentWrong")}</span>
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="focus-ring shrink-0 font-medium underline hover:no-underline"
        >
          {t("common.retry")}
        </button>
      )}
    </div>
  );
}
