import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";

export default function EmptyState({ hasFilters }) {
  const { t } = useTranslation();

  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-neutral-300 bg-white px-6 py-16 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-brand-50 text-brand-600">
        <svg viewBox="0 0 24 24" fill="none" className="h-6 w-6" aria-hidden="true">
          <path
            d="M4 21V9l8-6 8 6v12M4 21h16M9 21v-6h6v6"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>
      <h3 className="mt-4 text-sm font-semibold text-neutral-900">
        {hasFilters ? t("farms.empty.noResultsTitle") : t("farms.empty.title")}
      </h3>
      <p className="mt-1 max-w-sm text-sm text-neutral-500">
        {hasFilters ? t("farms.empty.noResultsSubtitle") : t("farms.empty.subtitle")}
      </p>
      {!hasFilters && (
        <Link
          to="/dashboard/farms/new"
          className="focus-ring mt-4 rounded-md bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700"
        >
          {t("farms.actions.addFarm")}
        </Link>
      )}
    </div>
  );
}
