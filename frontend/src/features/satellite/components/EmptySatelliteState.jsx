import { useTranslation } from "react-i18next";
import { SatelliteDish } from "lucide-react";

export default function EmptySatelliteState({ title, description, action }) {
  const { t } = useTranslation();

  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-neutral-200 bg-white px-6 py-16 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-50">
        <SatelliteDish className="h-7 w-7 text-brand-400" aria-hidden="true" />
      </div>
      <div>
        <h3 className="text-base font-semibold text-neutral-900">
          {title || t("satellite.empty.title")}
        </h3>
        <p className="mt-1 max-w-sm text-sm text-neutral-500">
          {description || t("satellite.empty.description")}
        </p>
      </div>
      {action && <div className="mt-1">{action}</div>}
    </div>
  );
}
