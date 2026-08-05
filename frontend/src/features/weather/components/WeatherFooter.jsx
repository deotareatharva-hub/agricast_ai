import { useTranslation } from "react-i18next";

// Small, quiet attribution line - farmers relying on this for spraying/
// irrigation decisions should know where the numbers come from. Kept as
// its own component (rather than inlined in WeatherPage) since the DoD
// lists it separately and a future module might reuse it verbatim.
export default function WeatherFooter() {
  const { t } = useTranslation();

  return (
    <p className="border-t border-neutral-100 pt-4 text-center text-xs text-neutral-400">
      {t("weather.footer.source")}
    </p>
  );
}
