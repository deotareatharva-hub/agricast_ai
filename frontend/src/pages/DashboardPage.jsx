import { useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Sprout, PlusCircle, Radio, ArrowUpRight, MapPin } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { api } from "../lib/axios";
import { useFarms } from "../features/farms/hooks/useFarms";
import Loading from "../components/common/Loading";
import Card from "../components/ui/Card";
import { buttonClasses } from "../components/ui/Button";
import StatCard from "../components/ui/StatCard";
import Badge from "../components/ui/Badge";
import EmptyState from "../components/ui/EmptyState";

// Backend health check, unchanged from Phase 1 - proves the frontend <->
// backend wire-up. Kept and restyled rather than removed.
async function fetchHealth() {
  const { data } = await api.get("/health");
  return data;
}

const containerVariants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.06 } },
};
const itemVariants = {
  hidden: { opacity: 0, y: 10 },
  show: { opacity: 1, y: 0, transition: { duration: 0.35, ease: [0.16, 1, 0.3, 1] } },
};

export default function DashboardPage() {
  const { t } = useTranslation();
  const { user } = useAuth();

  const { data: health, isLoading: healthLoading, isError: healthError, error } = useQuery({
    queryKey: ["health-check"],
    queryFn: fetchHealth,
    retry: 1,
  });

  const { data: farms, isLoading: farmsLoading } = useFarms();
  const farmCount = farms?.length ?? 0;
  const cropTypes = new Set((farms || []).map((f) => f.crop).filter(Boolean)).size;

  return (
    <div className="mx-auto max-w-6xl">
      {/* Hero */}
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
        className="relative overflow-hidden rounded-3xl bg-gradient-hero px-6 py-8 text-white shadow-[var(--shadow-soft-lg)] sm:px-9 sm:py-10"
      >
        <div className="bg-noise-overlay absolute inset-0 opacity-40" aria-hidden="true" />
        <div className="pointer-events-none absolute -right-16 -top-16 h-64 w-64 rounded-full bg-white/10 blur-3xl" aria-hidden="true" />
        <div className="relative flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <Badge className="bg-white/15 text-white ring-white/20">{t("nav.dashboard")}</Badge>
            <h1 className="mt-3 text-2xl font-bold tracking-[-0.02em] sm:text-3xl lg:text-4xl">
              {t("dashboard.welcome", { name: user?.fullName?.split(" ")[0] || "" })}
            </h1>
            <p className="mt-2 max-w-xl text-[15px] text-white/75">{t("dashboard.subtitle")}</p>
          </div>
          <div className="flex shrink-0 flex-wrap gap-3">
            <Link
              to="/dashboard/farms/new"
              className="focus-ring inline-flex items-center gap-2 rounded-full bg-white px-5 py-2.5 text-sm font-semibold text-brand-700 shadow-[var(--shadow-soft-md)] transition hover:brightness-95"
            >
              <PlusCircle className="h-4 w-4" aria-hidden="true" />
              Add a farm
            </Link>
            <Link
              to="/dashboard/farms"
              className="focus-ring inline-flex items-center gap-2 rounded-full border border-white/25 bg-white/10 px-5 py-2.5 text-sm font-semibold text-white backdrop-blur transition hover:bg-white/20"
            >
              View farms
              <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
            </Link>
          </div>
        </div>
      </motion.div>

      {/* Stat row */}
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="show"
        className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
      >
        <motion.div variants={itemVariants}>
          <StatCard
            icon={Sprout}
            label="Your farms"
            value={farmsLoading ? "…" : farmCount}
            hint={farmCount === 0 ? "Add your first farm to get started" : "Registered on AgriCast AI"}
          />
        </motion.div>
        <motion.div variants={itemVariants}>
          <StatCard
            icon={MapPin}
            label="Crops tracked"
            value={farmsLoading ? "…" : cropTypes}
            hint="Distinct crop types across your farms"
            accent="amber"
          />
        </motion.div>
        <motion.div variants={itemVariants} className="sm:col-span-2 lg:col-span-1">
          <Card className="h-full">
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-info-50 to-info-100/60 text-info-600">
                <Radio className="h-5 w-5" aria-hidden="true" />
              </span>
              <h2 className="text-sm font-semibold text-neutral-500">{t("dashboard.connectionStatus")}</h2>
            </div>
            <div className="mt-3.5">
              {healthLoading && <p className="text-sm text-neutral-400">Checking backend…</p>}
              {healthError && <p className="text-sm text-red-600">Could not reach backend: {error?.message}</p>}
              {health && (
                <div className="flex items-center gap-2">
                  <span className="relative flex h-2.5 w-2.5">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-brand-400 opacity-60" />
                    <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-brand-500" />
                  </span>
                  <span className="text-sm font-medium text-neutral-700">
                    {health.message} · {health.environment}
                  </span>
                </div>
              )}
            </div>
          </Card>
        </motion.div>
      </motion.div>

      {/* Farms preview */}
      <div className="mt-8">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-bold tracking-[-0.01em] text-neutral-900">Your farms</h2>
          {farmCount > 0 && (
            <Link to="/dashboard/farms" className="focus-ring text-sm font-semibold text-brand-700 hover:underline">
              View all
            </Link>
          )}
        </div>

        {farmsLoading && <Loading label="Loading your farms…" />}

        {!farmsLoading && farmCount === 0 && (
          <EmptyState
            icon={Sprout}
            title="No farms yet"
            description="Add your first farm to start tracking weather, satellite health, and AI recommendations."
            action={
              <Link to="/dashboard/farms/new" className={buttonClasses({ variant: "primary" })}>
                <PlusCircle className="h-4 w-4" aria-hidden="true" />
                Add your first farm
              </Link>
            }
          />
        )}

        {!farmsLoading && farmCount > 0 && (
          <motion.div variants={containerVariants} initial="hidden" animate="show" className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {farms.slice(0, 6).map((farm) => (
              <motion.div key={farm.id} variants={itemVariants}>
                <Link to={`/dashboard/farms/${farm.id}`}>
                  <Card interactive className="h-full">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h3 className="text-base font-semibold text-neutral-900">{farm.farmName}</h3>
                        <p className="text-sm text-neutral-500">{farm.crop}</p>
                      </div>
                      <Badge>{farm.area} {t(`farms.areaUnits.${farm.areaUnit}`)}</Badge>
                    </div>
                    <p className="mt-3 truncate text-sm text-neutral-400">
                      {[farm.village, farm.district, farm.state].filter(Boolean).join(", ")}
                    </p>
                  </Card>
                </Link>
              </motion.div>
            ))}
          </motion.div>
        )}
      </div>
    </div>
  );
}
