import { Link, Outlet } from "react-router-dom";
import { useTranslation } from "react-i18next";
import LanguageSwitcher from "../components/common/LanguageSwitcher";
import { AuthHero, AgriCastMark, AuthCard, AuthFooter, ThemeToggle, VersionBadge } from "../components/auth";

// Split-screen layout shared by Login and Register: a 40% animated
// hero panel (desktop only) plus a 60% column holding the auth card.
export default function AuthLayout() {
  const { t } = useTranslation();

  return (
    <div className="flex min-h-screen bg-neutral-50 dark:bg-neutral-950">
      <div className="w-full lg:w-[40%] lg:shrink-0">
        <AuthHero />
      </div>

      <div className="flex w-full flex-1 flex-col lg:w-[60%]">
        <div className="flex items-center justify-between p-4 sm:p-6">
          <Link to="/" className="lg:hidden" aria-label={t("app.name")}>
            <AgriCastMark dark={false} size="sm" />
          </Link>
          <div className="ml-auto flex items-center gap-3">
            <VersionBadge />
            <LanguageSwitcher />
            <ThemeToggle />
          </div>
        </div>

        <div className="flex flex-1 items-center justify-center px-4 pb-8 sm:px-6">
          <AuthCard className="max-w-md">
            <Outlet />
          </AuthCard>
        </div>

        <div className="px-4 pb-6 sm:px-6">
          <AuthFooter className="mx-auto max-w-md" />
        </div>
      </div>
    </div>
  );
}
