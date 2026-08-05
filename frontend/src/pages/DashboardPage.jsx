import { useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";
import { Sprout } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { api } from "../lib/axios";
import { useFarms } from "../features/farms/hooks/useFarms";
import Loading from "../components/common/Loading";
import Card from "../components/ui/Card";
import StatCard from "../components/ui/StatCard";

// Simple "is the backend alive" check, used to prove the frontend <-> backend
// wire-up in Phase 1. Later phases replace this with real feature widgets.
async function fetchHealth() {
  const { data } = await api.get("/health");
  return data;
}

export default function DashboardPage() {
  const { t } = useTranslation();
  const { user } = useAuth();

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["health-check"],
    queryFn: fetchHealth,
    retry: 1,
  });

  // First real usage of StatCard/useFarms on this page - proves out the
  // pattern future Weather/Analytics widgets should follow instead of
  // each building a bespoke number display.
  const { data: farms } = useFarms();

  return (
    <div className="mx-auto max-w-5xl">
      <h1 className="text-2xl font-semibold text-neutral-900">
        {t("dashboard.welcome", { name: user?.fullName || "" })}
      </h1>
      <p className="mt-2 max-w-2xl text-neutral-600">{t("dashboard.subtitle")}</p>

      <div className="mt-8 grid gap-6 sm:grid-cols-3">
        <StatCard icon={Sprout} label={t("dashboard.yourFarms")} value={farms?.length ?? "–"} />

        <Card>
          <h2 className="text-sm font-semibold uppercase tracking-wide text-neutral-500">
            {t("dashboard.accountInfo")}
          </h2>
          <dl className="mt-3 space-y-1 text-sm">
            <div className="flex justify-between">
              <dt className="text-neutral-500">Name</dt>
              <dd className="font-medium text-neutral-900">{user?.fullName}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-neutral-500">Email</dt>
              <dd className="font-medium text-neutral-900">{user?.email}</dd>
            </div>
          </dl>
        </Card>

        <Card>
          <h2 className="text-sm font-semibold uppercase tracking-wide text-neutral-500">
            {t("dashboard.connectionStatus")}
          </h2>
          <div className="mt-3">
            {isLoading && <Loading label="Checking backend..." />}
            {isError && (
              <p className="text-sm text-red-600">
                Could not reach backend: {error?.message}
              </p>
            )}
            {data && (
              <div className="flex items-center gap-2 text-sm text-brand-700">
                <span className="h-2 w-2 rounded-full bg-brand-500" />
                <span>
                  {data.message} &middot; {data.environment}
                </span>
              </div>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}
