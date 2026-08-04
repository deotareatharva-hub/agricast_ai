import { useTranslation } from "react-i18next";

// Shared loading indicator used for route-level suspense states and
// in-flight API calls.
export default function Loading({ label }) {
  const { t } = useTranslation();
  return (
    <div className="flex h-full min-h-[200px] w-full flex-col items-center justify-center gap-3 py-16 text-neutral-500">
      <div
        className="h-8 w-8 animate-spin rounded-full border-2 border-brand-200 border-t-brand-600"
        role="status"
        aria-label={label || t("common.loading")}
      />
      <span className="text-sm">{label || t("common.loading")}</span>
    </div>
  );
}
