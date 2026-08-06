import { NavLink } from "react-router-dom";
import { useTranslation } from "react-i18next";

// Phase 1 sidebar only had the Dashboard link. Sprint 1 adds Farms; future
// phases (Weather, AI Advisory, Sentinel, Analytics, Reports) will add
// entries here without changing the layout shell itself.
const NAV_ITEMS = [
  { key: "dashboard", to: "/dashboard" },
  { key: "farms", to: "/dashboard/farms" },
  { key: "profile", to: "/dashboard/profile" },
  { key: "settings", to: "/dashboard/settings" },
];

export default function Sidebar() {
  const { t } = useTranslation();

  return (
    <aside className="hidden w-60 shrink-0 border-r border-neutral-200 bg-white md:block">
      <nav className="flex flex-col gap-1 p-4">
        {NAV_ITEMS.map((item) => (
          <NavLink
            key={item.key}
            to={item.to}
            end={item.to === "/dashboard"}
            className={({ isActive }) =>
              `focus-ring rounded-md px-3 py-2 text-sm font-medium ${
                isActive
                  ? "bg-brand-50 text-brand-700"
                  : "text-neutral-600 hover:bg-neutral-100"
              }`
            }
          >
            {t(`nav.${item.key}`)}
          </NavLink>
        ))}
      </nav>
    </aside>
  );
}
