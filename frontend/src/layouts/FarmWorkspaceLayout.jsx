import { NavLink, Outlet, useParams } from "react-router-dom";
import { motion } from "framer-motion";
import { BarChart3, CloudSun, FileText, LayoutGrid, Satellite, Sparkles } from "lucide-react";
import { useFarm } from "../features/farms/hooks/useFarm";
import Loading from "../components/common/Loading";
import ErrorState from "../components/common/ErrorState";
import Badge from "../components/ui/Badge";

const TABS = [
  { key: "overview", to: "", label: "Overview", icon: LayoutGrid },
  { key: "weather", to: "weather", label: "Weather", icon: CloudSun },
  { key: "satellite", to: "satellite", label: "Satellite", icon: Satellite },
  { key: "advisory", to: "advisory", label: "AI Advisory", icon: Sparkles },
  { key: "analytics", to: "analytics", label: "Analytics", icon: BarChart3 },
  { key: "reports", to: "reports", label: "Reports", icon: FileText },
];

// Fetches the farm once and exposes it to every nested module page via
// <Outlet context={{ farm }} />, so Weather/Satellite/AI/Analytics/Reports
// pages don't each need their own farm fetch or :id parsing. Unchanged from
// before this redesign - only the presentation below is new.
export default function FarmWorkspaceLayout() {
  const { id } = useParams();
  const { data: farm, isLoading, isError, error, refetch } = useFarm(id);

  if (isLoading) return <Loading label="Loading farm…" />;

  if (isError || !farm) {
    return (
      <ErrorState
        message={error?.message || "Could not load this farm."}
        onRetry={refetch}
      />
    );
  }

  return (
    <div className="mx-auto max-w-6xl">
      <motion.div
        initial={{ opacity: 0, y: -6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="relative mb-6 overflow-hidden rounded-2xl bg-gradient-hero p-6 text-white shadow-[var(--shadow-soft-lg)] sm:p-7"
      >
        <div className="bg-noise-overlay absolute inset-0 opacity-40" aria-hidden="true" />
        <div className="relative flex flex-wrap items-center justify-between gap-4">
          <div>
            <Badge className="bg-white/15 text-white ring-white/20">{farm.crop}</Badge>
            <h1 className="mt-2 text-2xl font-bold tracking-[-0.01em] sm:text-3xl">{farm.farmName}</h1>
            {farm.location?.label && <p className="mt-1 text-sm text-white/70">{farm.location.label}</p>}
          </div>
        </div>
      </motion.div>

      <div className="mb-6 overflow-x-auto">
        <nav className="scrollbar-thin flex min-w-max gap-1 rounded-2xl border border-neutral-900/[0.06] bg-white p-1.5 shadow-[var(--shadow-soft-sm)]">
          {TABS.map((tab) => {
            const Icon = tab.icon;
            return (
              <NavLink
                key={tab.key}
                to={tab.to}
                end={tab.to === ""}
                className={({ isActive }) =>
                  `focus-ring relative flex shrink-0 items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium transition-colors ${
                    isActive ? "text-brand-700" : "text-neutral-500 hover:text-neutral-800"
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    {isActive && (
                      <motion.span
                        layoutId="farm-tab-active-pill"
                        className="absolute inset-0 rounded-xl bg-gradient-to-b from-brand-50 to-accent-100/50 shadow-[inset_0_0_0_1px_rgb(22_163_74/0.12)]"
                        transition={{ type: "spring", stiffness: 500, damping: 40 }}
                      />
                    )}
                    <Icon className="relative z-10 h-4 w-4" aria-hidden="true" />
                    <span className="relative z-10 whitespace-nowrap">{tab.label}</span>
                  </>
                )}
              </NavLink>
            );
          })}
        </nav>
      </div>

      <Outlet context={{ farm }} />
    </div>
  );
}
