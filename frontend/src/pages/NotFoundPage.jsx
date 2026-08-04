import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";

export default function NotFoundPage() {
  const { t } = useTranslation();

  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center px-4 text-center">
      <p className="text-7xl font-bold text-brand-600">404</p>
      <h1 className="mt-4 text-2xl font-semibold text-neutral-900">
        {t("notFound.title")}
      </h1>
      <p className="mt-2 text-neutral-500">{t("notFound.subtitle")}</p>
      <Link
        to="/"
        className="focus-ring mt-6 rounded-md bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700"
      >
        {t("notFound.backHome")}
      </Link>
    </div>
  );
}
