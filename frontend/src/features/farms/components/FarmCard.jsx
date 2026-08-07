import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";
import { MapPin, Pencil, Trash2, ArrowUpRight } from "lucide-react";
import Card from "../../../components/ui/Card";
import Badge from "../../../components/ui/Badge";

export default function FarmCard({ farm, onDeleteClick }) {
  const { t } = useTranslation();

  return (
    <motion.div whileHover={{ y: -3 }} transition={{ duration: 0.2 }}>
      <Card interactive className="flex h-full flex-col">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <h3 className="truncate text-base font-semibold text-neutral-900">{farm.farmName}</h3>
            <p className="text-sm text-neutral-500">{farm.crop}</p>
          </div>
          <Badge className="shrink-0">
            {farm.area} {t(`farms.areaUnits.${farm.areaUnit}`)}
          </Badge>
        </div>

        <p className="mt-3 flex items-center gap-1.5 truncate text-sm text-neutral-400">
          <MapPin className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
          {[farm.village, farm.district, farm.state, farm.country].filter(Boolean).join(", ") || "—"}
        </p>

        <div className="mt-4 flex items-center gap-4 border-t border-neutral-900/[0.05] pt-4 text-sm">
          <Link
            to={`/dashboard/farms/${farm.id}`}
            className="focus-ring inline-flex items-center gap-1 font-semibold text-brand-700 hover:underline"
          >
            {t("farms.actions.view")}
            <ArrowUpRight className="h-3.5 w-3.5" aria-hidden="true" />
          </Link>
          <Link
            to={`/dashboard/farms/${farm.id}/edit`}
            className="focus-ring inline-flex items-center gap-1 font-medium text-neutral-500 hover:text-neutral-800"
          >
            <Pencil className="h-3.5 w-3.5" aria-hidden="true" />
            {t("farms.actions.edit")}
          </Link>
          <button
            type="button"
            onClick={() => onDeleteClick(farm)}
            className="focus-ring ml-auto inline-flex items-center gap-1 font-medium text-red-500 hover:text-red-700"
          >
            <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
            {t("farms.actions.delete")}
          </button>
        </div>
      </Card>
    </motion.div>
  );
}
