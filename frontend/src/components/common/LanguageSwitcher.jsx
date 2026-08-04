import { useTranslation } from "react-i18next";
import { SUPPORTED_LANGUAGES } from "../../i18n";

// Dropdown that lets the user switch the active language. i18next-browser-
// languagedetector persists the choice to localStorage automatically.
export default function LanguageSwitcher({ className = "" }) {
  const { i18n, t } = useTranslation();

  return (
    <label className={`flex items-center gap-2 text-sm ${className}`}>
      <span className="sr-only">{t("common.language")}</span>
      <select
        value={i18n.resolvedLanguage}
        onChange={(e) => i18n.changeLanguage(e.target.value)}
        className="focus-ring cursor-pointer rounded-md border border-neutral-300 bg-white px-2 py-1 text-sm text-neutral-700"
        aria-label={t("common.language")}
      >
        {SUPPORTED_LANGUAGES.map((lang) => (
          <option key={lang.code} value={lang.code}>
            {lang.label}
          </option>
        ))}
      </select>
    </label>
  );
}
