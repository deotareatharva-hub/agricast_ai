import { NavLink } from "react-router-dom";
import { useTranslation } from "react-i18next";

// Sidebar (desktop) and the mobile Drawer (see DashboardLayout) both need
// this exact list - it used to live only inside Sidebar, which is what
// left the dashboard with zero navigation on small screens (Sidebar was
// `hidden md:block` with nothing else covering it). Extracted once so
// adding a Weather/AI/Analytics/Reports entry later updates both surfaces
// automatically.
export const DASHBOARD_NAV_ITEMS = [
  { key: "dashboard", to: "/dashboard" },
  { key: "farms", to: "/dashboard/farms" },
  { key: "weather", to: "/dashboard/weather" },
  { key: "satellite", to: "/dashboard/satellite" },
];

export default function DashboardNav({ onNavigate }) {
  const { t } = useTranslation();

  return (
    <nav className="flex flex-col gap-1">
      {DASHBOARD_NAV_ITEMS.map((item) => (
        <NavLink
          key={item.key}
          to={item.to}
          end={item.to === "/dashboard"}
          onClick={onNavigate}
          className={({ isActive }) =>
            `focus-ring rounded-md px-3 py-2 text-sm font-medium ${
              isActive ? "bg-brand-50 text-brand-700" : "text-neutral-600 hover:bg-neutral-100"
            }`
          }
        >
          {t(`nav.${item.key}`)}
        </NavLink>
      ))}
    </nav>
  );
}
