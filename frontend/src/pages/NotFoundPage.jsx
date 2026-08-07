import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";
import { Leaf } from "lucide-react";

export default function NotFoundPage() {
  const { t } = useTranslation();

  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center px-4 text-center">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
      >
        <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-hero text-white shadow-[var(--shadow-glow-brand)]">
          <Leaf className="h-7 w-7" aria-hidden="true" />
        </span>
        <p className="mt-6 text-gradient-brand text-7xl font-bold tracking-[-0.03em]">404</p>
        <h1 className="mt-3 text-2xl font-bold tracking-[-0.01em] text-neutral-900">
          {t("notFound.title")}
        </h1>
        <p className="mt-2 text-neutral-500">{t("notFound.subtitle")}</p>
        <Link
          to="/"
          className="focus-ring mt-7 inline-flex items-center gap-2 rounded-full bg-gradient-to-b from-brand-500 to-brand-600 px-5 py-2.5 text-sm font-semibold text-white shadow-[var(--shadow-glow-brand)] transition hover:brightness-105"
        >
          {t("notFound.backHome")}
        </Link>
      </motion.div>
    </div>
  );
}
