import { Link, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useAuth } from "../../context/AuthContext";
import LanguageSwitcher from "./LanguageSwitcher";

export default function Navbar() {
  const { t } = useTranslation();
  const { isAuthenticated, user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <header className="sticky top-0 z-40 border-b border-neutral-200 bg-white/90 backdrop-blur">
      <nav className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link to="/" className="flex items-center gap-2 font-semibold text-brand-700">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-600 text-sm font-bold text-white">
            A
          </span>
          <span>{t("app.name")}</span>
        </Link>

        <div className="flex items-center gap-4">
          <LanguageSwitcher />

          {isAuthenticated ? (
            <>
              <Link
                to="/dashboard"
                className="focus-ring hidden rounded-md px-3 py-2 text-sm font-medium text-neutral-700 hover:text-brand-700 sm:block"
              >
                {t("nav.dashboard")}
              </Link>
              <span className="hidden items-center gap-2 text-sm text-neutral-500 md:flex">
                {user?.avatarUrl && (
                  <img
                    src={user.avatarUrl}
                    alt=""
                    className="h-6 w-6 rounded-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                )}
                {user?.fullName}
              </span>
              <button
                type="button"
                onClick={handleLogout}
                className="focus-ring rounded-md bg-neutral-100 px-3 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-200"
              >
                {t("nav.logout")}
              </button>
            </>
          ) : (
            <>
              <Link
                to="/login"
                className="focus-ring rounded-md px-3 py-2 text-sm font-medium text-neutral-700 hover:text-brand-700"
              >
                {t("nav.login")}
              </Link>
              <Link
                to="/register"
                className="focus-ring rounded-md bg-brand-600 px-3 py-2 text-sm font-medium text-white hover:bg-brand-700"
              >
                {t("nav.register")}
              </Link>
            </>
          )}
        </div>
      </nav>
    </header>
  );
}
