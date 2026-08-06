import { NavLink, Outlet, useParams } from "react-router-dom";
import { useFarm } from "../features/farms/hooks/useFarm";
import Loading from "../components/common/Loading";
import ErrorState from "../components/common/ErrorState";

const TABS = [
  { key: "overview", to: "", label: "Overview" },
  { key: "weather", to: "weather", label: "Weather" },
  { key: "satellite", to: "satellite", label: "Satellite" },
  { key: "advisory", to: "advisory", label: "AI Advisory" },
  { key: "analytics", to: "analytics", label: "Analytics" },
  { key: "reports", to: "reports", label: "Reports" },
];

// Fetches the farm once and exposes it to every nested module page via
// <Outlet context={{ farm }} />, so Weather/Satellite/AI/Analytics/Reports
// pages don't each need their own farm fetch or :id parsing.
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
    <div className="mx-auto max-w-5xl">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-neutral-900">{farm.farmName}</h1>
        <p className="text-sm text-neutral-500">{farm.crop}</p>
      </div>

      <div className="mb-6 overflow-x-auto border-b border-neutral-200">
        <nav className="flex min-w-max gap-1">
          {TABS.map((tab) => (
            <NavLink
              key={tab.key}
              to={tab.to}
              end={tab.to === ""}
              className={({ isActive }) =>
                `focus-ring shrink-0 border-b-2 px-4 py-2.5 text-sm font-medium ${
                  isActive
                    ? "border-brand-600 text-brand-700"
                    : "border-transparent text-neutral-500 hover:text-neutral-700"
                }`
              }
            >
              {tab.label}
            </NavLink>
          ))}
        </nav>
      </div>

      <Outlet context={{ farm }} />
    </div>
  );
}
