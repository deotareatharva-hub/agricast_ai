import { useTranslation } from "react-i18next";

export default function Footer() {
  const { t } = useTranslation();
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-neutral-200 bg-white">
      <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-2 px-4 py-6 text-sm text-neutral-500 sm:flex-row sm:px-6 lg:px-8">
        <p>
          &copy; {year} {t("app.name")}. {t("footer.rights")}
        </p>
        <p className="text-neutral-400">{t("app.tagline")}</p>
      </div>
    </footer>
  );
}
