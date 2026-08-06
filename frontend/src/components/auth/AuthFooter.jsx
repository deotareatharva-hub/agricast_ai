import { useTranslation } from "react-i18next";
import { toast } from "react-toastify";

// No /privacy, /terms, or /contact routes exist yet - surface a
// "coming soon" toast rather than linking to a 404, matching how
// Google sign-in and "Forgot password" are handled elsewhere on
// these pages.
const notReady = (t, key, fallback) => () => toast.info(t(key, fallback));

export default function AuthFooter({ className = "" }) {
  const { t } = useTranslation();
  const year = new Date().getFullYear();

  return (
    <div
      className={`flex flex-col items-center gap-2 text-xs text-neutral-400 dark:text-neutral-500 sm:flex-row sm:justify-between ${className}`}
    >
      <p>
        © {year} AgriCast AI. {t("footer.rights", "All rights reserved.")}
      </p>
      <nav className="flex items-center gap-4" aria-label="Legal">
        <button
          type="button"
          onClick={notReady(t, "auth.pageComingSoon", "Coming soon")}
          className="transition-colors hover:text-neutral-600 dark:hover:text-neutral-300"
        >
          {t("auth.footerPrivacy", "Privacy")}
        </button>
        <button
          type="button"
          onClick={notReady(t, "auth.pageComingSoon", "Coming soon")}
          className="transition-colors hover:text-neutral-600 dark:hover:text-neutral-300"
        >
          {t("auth.footerTerms", "Terms")}
        </button>
        <button
          type="button"
          onClick={notReady(t, "auth.pageComingSoon", "Coming soon")}
          className="transition-colors hover:text-neutral-600 dark:hover:text-neutral-300"
        >
          {t("auth.footerContact", "Contact")}
        </button>
      </nav>
    </div>
  );
}
