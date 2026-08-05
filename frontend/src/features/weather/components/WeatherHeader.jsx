import { RefreshCw } from "lucide-react";
import { useTranslation } from "react-i18next";
import PageHeader from "../../../components/ui/PageHeader";
import Breadcrumb from "../../../components/ui/Breadcrumb";
import Button from "../../../components/ui/Button";
import { formatDateTime, toIntlLocale } from "../utils/weatherFormatters";

export default function WeatherHeader({ farm, observedAt, onRefresh, isRefreshing }) {
  const { t, i18n } = useTranslation();
  const locale = toIntlLocale(i18n.language);

  return (
    <PageHeader
      breadcrumb={
        farm && (
          <Breadcrumb
            items={[
              { label: t("farms.title"), to: "/dashboard/farms" },
              { label: farm.farmName, to: `/dashboard/farms/${farm.id}` },
              { label: t("weather.title") },
            ]}
          />
        )
      }
      title={t("weather.title")}
      subtitle={
        farm
          ? [farm.village, farm.district, farm.state].filter(Boolean).join(", ")
          : t("weather.subtitle")
      }
      actions={
        onRefresh && (
          <div className="flex items-center gap-3">
            {observedAt && (
              <span className="hidden text-xs text-neutral-400 sm:inline">
                {t("weather.updatedAt", { time: formatDateTime(observedAt, locale) })}
              </span>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={onRefresh}
              isLoading={isRefreshing}
              aria-label={t("weather.actions.refresh")}
            >
              {!isRefreshing && <RefreshCw className="h-4 w-4" aria-hidden="true" />}
              <span className="hidden sm:inline">{t("weather.actions.refresh")}</span>
            </Button>
          </div>
        )
      }
    />
  );
}
