import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { AnimatePresence, motion } from "framer-motion";
import { Bell, LogOut, Menu, Search, Sparkles } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import Avatar from "../ui/Avatar";
import LanguageSwitcher from "./LanguageSwitcher";

// Authenticated-app-only topbar. The marketing/public Navbar is untouched -
// this is a separate component so the two surfaces can evolve independently
// without risking the public site's markup.
export default function DashboardTopbar({ onOpenNav }) {
  const { t } = useTranslation();
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [notifOpen, setNotifOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const greeting = (() => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 18) return "Good afternoon";
    return "Good evening";
  })();

  return (
    <header className="sticky top-0 z-40 px-3 pt-3 sm:px-4 lg:px-6">
      <div className="mx-auto flex h-14 max-w-[1600px] items-center gap-3 rounded-2xl border border-white/60 bg-white/70 px-3 shadow-[var(--shadow-soft-md)] backdrop-blur-xl sm:px-4">
        <button
          type="button"
          onClick={onOpenNav}
          className="focus-ring -ml-1 flex h-9 w-9 items-center justify-center rounded-xl text-neutral-500 hover:bg-neutral-900/[0.05] md:hidden"
          aria-label="Open navigation"
        >
          <Menu className="h-5 w-5" aria-hidden="true" />
        </button>

        <span className="hidden text-sm text-neutral-400 md:block">
          {greeting}
          {user?.fullName ? `, ${user.fullName.split(" ")[0]}` : ""}
        </span>

        <div className="relative ml-1 hidden max-w-xs flex-1 md:block lg:max-w-sm">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" aria-hidden="true" />
          <input
            type="search"
            placeholder="Search farms, reports…"
            className="focus-ring w-full rounded-xl border border-transparent bg-neutral-900/[0.04] py-2 pl-9 pr-3 text-sm text-neutral-700 placeholder:text-neutral-400 transition hover:bg-neutral-900/[0.06] focus:bg-white"
          />
        </div>

        <div className="ml-auto flex items-center gap-1.5 sm:gap-2">
          <Link
            to="/dashboard/farms"
            className="focus-ring hidden items-center gap-1.5 rounded-full bg-gradient-to-r from-brand-600 to-emerald-500 px-3.5 py-2 text-xs font-semibold text-white shadow-[var(--shadow-glow-brand)] transition hover:brightness-105 sm:inline-flex"
          >
            <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
            Ask AI
          </Link>

          <LanguageSwitcher className="hidden sm:flex" />

          <div className="relative">
            <button
              type="button"
              onClick={() => {
                setNotifOpen((v) => !v);
                setProfileOpen(false);
              }}
              className="focus-ring relative flex h-9 w-9 items-center justify-center rounded-xl text-neutral-500 transition hover:bg-neutral-900/[0.05]"
              aria-label="Notifications"
            >
              <Bell className="h-[18px] w-[18px]" aria-hidden="true" />
            </button>
            <AnimatePresence>
              {notifOpen && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setNotifOpen(false)} />
                  <motion.div
                    initial={{ opacity: 0, y: -6, scale: 0.97 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -6, scale: 0.97 }}
                    transition={{ duration: 0.15 }}
                    className="absolute right-0 z-20 mt-2 w-72 rounded-2xl border border-white/60 bg-white/95 p-4 text-sm shadow-[var(--shadow-soft-lg)] backdrop-blur-xl"
                  >
                    <p className="font-semibold text-neutral-900">Notifications</p>
                    <p className="mt-3 text-neutral-400">You're all caught up — nothing new right now.</p>
                  </motion.div>
                </>
              )}
            </AnimatePresence>
          </div>

          <div className="relative">
            <button
              type="button"
              onClick={() => {
                setProfileOpen((v) => !v);
                setNotifOpen(false);
              }}
              className="focus-ring flex items-center gap-2 rounded-full py-1 pl-1 pr-1.5 transition hover:bg-neutral-900/[0.05]"
            >
              {user?.avatarUrl ? (
                <img
                  src={user.avatarUrl}
                  alt=""
                  className="h-7 w-7 rounded-full object-cover"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <Avatar name={user?.fullName} size="sm" />
              )}
            </button>
            <AnimatePresence>
              {profileOpen && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setProfileOpen(false)} />
                  <motion.div
                    initial={{ opacity: 0, y: -6, scale: 0.97 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -6, scale: 0.97 }}
                    transition={{ duration: 0.15 }}
                    className="absolute right-0 z-20 mt-2 w-56 rounded-2xl border border-white/60 bg-white/95 p-2 text-sm shadow-[var(--shadow-soft-lg)] backdrop-blur-xl"
                  >
                    <div className="px-3 py-2">
                      <p className="truncate font-semibold text-neutral-900">{user?.fullName}</p>
                      <p className="truncate text-xs text-neutral-400">{user?.email}</p>
                    </div>
                    <div className="my-1 h-px bg-neutral-100" />
                    <Link
                      to="/dashboard/profile"
                      onClick={() => setProfileOpen(false)}
                      className="focus-ring block rounded-xl px-3 py-2 font-medium text-neutral-600 hover:bg-neutral-900/[0.05]"
                    >
                      {t("nav.profile")}
                    </Link>
                    <Link
                      to="/dashboard/settings"
                      onClick={() => setProfileOpen(false)}
                      className="focus-ring block rounded-xl px-3 py-2 font-medium text-neutral-600 hover:bg-neutral-900/[0.05]"
                    >
                      {t("nav.settings")}
                    </Link>
                    <button
                      type="button"
                      onClick={handleLogout}
                      className="focus-ring flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left font-medium text-red-600 hover:bg-red-50"
                    >
                      <LogOut className="h-4 w-4" aria-hidden="true" />
                      {t("nav.logout")}
                    </button>
                  </motion.div>
                </>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </header>
  );
}
