import { useState } from "react";
import { NavLink, Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";
import {
  LayoutDashboard,
  Sprout,
  UserRound,
  Settings2,
  ChevronsLeft,
  ChevronsRight,
  PlusCircle,
  Leaf,
} from "lucide-react";

// Same four destinations as before this redesign (Dashboard, Farms,
// Profile, Settings) - routing/App.jsx is untouched. Only the visual
// language (icons, active-pill motion, optional collapse) is new.
const NAV_ITEMS = [
  { key: "dashboard", to: "/dashboard", icon: LayoutDashboard, end: true },
  { key: "farms", to: "/dashboard/farms", icon: Sprout },
  { key: "profile", to: "/dashboard/profile", icon: UserRound },
  { key: "settings", to: "/dashboard/settings", icon: Settings2 },
];

export function SidebarNavLinks({ onNavigate, collapsed = false }) {
  const { t } = useTranslation();

  return (
    <nav className="flex flex-col gap-1">
      {NAV_ITEMS.map((item) => {
        const Icon = item.icon;
        return (
          <NavLink
            key={item.key}
            to={item.to}
            end={item.end}
            onClick={onNavigate}
            className={({ isActive }) =>
              `focus-ring group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors ${
                isActive ? "text-brand-700" : "text-neutral-500 hover:bg-neutral-900/[0.04] hover:text-neutral-800"
              }`
            }
          >
            {({ isActive }) => (
              <>
                {isActive && (
                  <motion.span
                    layoutId="sidebar-active-pill"
                    className="absolute inset-0 rounded-xl bg-gradient-to-r from-brand-50 to-accent-100/70 shadow-[inset_0_0_0_1px_rgb(22_163_74/0.12)]"
                    transition={{ type: "spring", stiffness: 500, damping: 40 }}
                  />
                )}
                <Icon className={`relative z-10 h-[18px] w-[18px] shrink-0 ${isActive ? "text-brand-600" : "text-neutral-400 group-hover:text-neutral-600"}`} aria-hidden="true" />
                {!collapsed && <span className="relative z-10">{t(`nav.${item.key}`)}</span>}
              </>
            )}
          </NavLink>
        );
      })}
    </nav>
  );
}

export default function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <motion.aside
      animate={{ width: collapsed ? 84 : 264 }}
      transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
      className="sticky top-[5.5rem] hidden h-[calc(100vh-6.5rem)] shrink-0 md:block"
    >
      <div className="flex h-full flex-col rounded-2xl border border-white/60 bg-white/70 p-4 shadow-[var(--shadow-soft-md)] backdrop-blur-xl">
        <Link to="/dashboard" className="focus-ring mb-5 flex items-center gap-2.5 rounded-xl px-1.5 py-1">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-hero text-white shadow-[var(--shadow-glow-brand)]">
            <Leaf className="h-[18px] w-[18px]" aria-hidden="true" />
          </span>
          {!collapsed && <span className="font-display text-[15px] font-bold tracking-[-0.01em] text-neutral-900">AgriCast AI</span>}
        </Link>

        <SidebarNavLinks collapsed={collapsed} />

        {!collapsed && (
          <Link
            to="/dashboard/farms/new"
            className="focus-ring mt-4 flex items-center gap-2 rounded-xl border border-dashed border-brand-300/70 bg-brand-50/50 px-3 py-2.5 text-sm font-semibold text-brand-700 transition hover:bg-brand-50"
          >
            <PlusCircle className="h-[18px] w-[18px]" aria-hidden="true" />
            Add Farm
          </Link>
        )}

        <div className="mt-auto pt-4">
          <button
            type="button"
            onClick={() => setCollapsed((prev) => !prev)}
            className="focus-ring flex w-full items-center justify-center gap-2 rounded-xl px-3 py-2 text-xs font-medium text-neutral-400 transition hover:bg-neutral-900/[0.04] hover:text-neutral-600"
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {collapsed ? <ChevronsRight className="h-4 w-4" /> : <><ChevronsLeft className="h-4 w-4" /> Collapse</>}
          </button>
        </div>
      </div>
    </motion.aside>
  );
}
