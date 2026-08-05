import { useTranslation } from "react-i18next";
import { Sprout } from "lucide-react";
import UiEmptyState from "../../../components/ui/EmptyState";
import { Link } from "react-router-dom";
import { buttonClasses } from "../../../components/ui/Button";

// Thin farms-specific wrapper around the shared EmptyState - owns the
// copy and the "Add Farm" CTA, delegates the actual layout/markup.
export default function EmptyState({ hasFilters }) {
  const { t } = useTranslation();

  return (
    <UiEmptyState
      icon={Sprout}
      title={hasFilters ? t("farms.empty.noResultsTitle") : t("farms.empty.title")}
      description={hasFilters ? t("farms.empty.noResultsSubtitle") : t("farms.empty.subtitle")}
      action={
        !hasFilters && (
          <Link to="/dashboard/farms/new" className={buttonClasses()}>
            {t("farms.actions.addFarm")}
          </Link>
        )
      }
    />
  );
}
