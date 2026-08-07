import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";
import { Leaf } from "lucide-react";

// Shared loading indicator used for route-level suspense states and
// in-flight API calls.
export default function Loading({ label }) {
  const { t } = useTranslation();
  return (
    <div className="flex h-full min-h-[200px] w-full flex-col items-center justify-center gap-3 py-16 text-neutral-500">
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ repeat: Infinity, duration: 1.4, ease: "linear" }}
        className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-brand-100 to-accent-100 text-brand-600"
        role="status"
        aria-label={label || t("common.loading")}
      >
        <Leaf className="h-4 w-4" aria-hidden="true" />
      </motion.div>
      <span className="text-sm font-medium">{label || t("common.loading")}</span>
    </div>
  );
}
