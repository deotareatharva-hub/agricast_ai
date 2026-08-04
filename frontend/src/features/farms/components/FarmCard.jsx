import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";

export default function FarmCard({ farm, onDeleteClick }) {
  const { t } = useTranslation();

  return (
    <div className="flex flex-col rounded-xl border border-neutral-200 bg-white p-5 transition hover:border-brand-300 hover:shadow-sm">
      <div className="flex items-start justify-between gap-2">
        <div>
          <h3 className="text-base font-semibold text-neutral-900">{farm.farmName}</h3>
          <p className="text-sm text-neutral-500">{farm.crop}</p>
        </div>
        <span className="shrink-0 rounded-full bg-brand-50 px-2.5 py-1 text-xs font-medium text-brand-700">
          {farm.area} {t(`farms.areaUnits.${farm.areaUnit}`)}
        </span>
      </div>

      <p className="mt-3 text-sm text-neutral-500">
        {[farm.village, farm.district, farm.state, farm.country].filter(Boolean).join(", ")}
      </p>

      <div className="mt-4 flex items-center gap-3 border-t border-neutral-100 pt-4 text-sm">
        <Link
          to={`/dashboard/farms/${farm.id}`}
          className="focus-ring font-medium text-brand-700 hover:underline"
        >
          {t("farms.actions.view")}
        </Link>
        <Link
          to={`/dashboard/farms/${farm.id}/edit`}
          className="focus-ring font-medium text-neutral-600 hover:underline"
        >
          {t("farms.actions.edit")}
        </Link>
        <button
          type="button"
          onClick={() => onDeleteClick(farm)}
          className="focus-ring ml-auto font-medium text-red-600 hover:underline"
        >
          {t("farms.actions.delete")}
        </button>
      </div>
    </div>
  );
}
