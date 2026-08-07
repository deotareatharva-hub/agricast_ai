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
        className="focus-ring cursor-pointer rounded-xl border border-transparent bg-neutral-900/[0.04] px-2.5 py-1.5 text-sm text-neutral-600 transition hover:bg-neutral-900/[0.07]"
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
