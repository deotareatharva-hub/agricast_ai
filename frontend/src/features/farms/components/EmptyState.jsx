import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Sprout, PlusCircle } from "lucide-react";
import UIEmptyState from "../../../components/ui/EmptyState";
import { buttonClasses } from "../../../components/ui/Button";

export default function EmptyState({ hasFilters }) {
  const { t } = useTranslation();

  return (
    <UIEmptyState
      icon={Sprout}
      title={hasFilters ? t("farms.empty.noResultsTitle") : t("farms.empty.title")}
      description={hasFilters ? t("farms.empty.noResultsSubtitle") : t("farms.empty.subtitle")}
      action={
        !hasFilters && (
          <Link to="/dashboard/farms/new" className={buttonClasses({ variant: "primary" })}>
            <PlusCircle className="h-4 w-4" aria-hidden="true" />
            {t("farms.actions.addFarm")}
          </Link>
        )
      }
    />
  );
}
