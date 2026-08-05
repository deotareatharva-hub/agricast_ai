import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useAuth } from "../context/AuthContext";
import { buttonClasses } from "../components/ui/Button";

export default function LandingPage() {
  const { t } = useTranslation();
  const { isAuthenticated } = useAuth();

  return (
    <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-3xl text-center">
        <span className="inline-block rounded-full bg-brand-50 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-brand-700">
          {t("app.name")}
        </span>
        <h1 className="mt-6 text-4xl font-bold tracking-tight text-neutral-900 sm:text-5xl">
          {t("landing.heroTitle")}
        </h1>
        <p className="mt-6 text-lg text-neutral-600">
          {t("landing.heroSubtitle")}
        </p>
        <div className="mt-10 flex items-center justify-center gap-4">
          <Link
            to={isAuthenticated ? "/dashboard" : "/register"}
            className={buttonClasses({ size: "lg" })}
          >
            {t("landing.getStarted")}
          </Link>
          {!isAuthenticated && (
            <Link
              to="/login"
              className="focus-ring rounded-md px-5 py-3 text-sm font-semibold text-neutral-700 hover:text-brand-700"
            >
              {t("landing.learnMore")}
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
