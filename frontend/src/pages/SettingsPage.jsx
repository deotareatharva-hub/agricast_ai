import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";
import { Palette, Globe, Ruler, Bell } from "lucide-react";
import { SUPPORTED_LANGUAGES } from "../i18n";
import { useSettings } from "../features/settings/useSettings";
import PageHeader from "../components/ui/PageHeader";
import Card from "../components/ui/Card";
import Select from "../components/ui/Select";
import Badge from "../components/ui/Badge";

function SettingRow({ icon: Icon, label, description, children }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-neutral-900/[0.05] py-4 last:border-b-0">
      <div className="flex items-start gap-3">
        {Icon && (
          <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-neutral-900/[0.04] text-neutral-500">
            <Icon className="h-4 w-4" aria-hidden="true" />
          </span>
        )}
        <div>
          <div className="text-sm font-semibold text-neutral-900">{label}</div>
          {description && <div className="text-xs text-neutral-400">{description}</div>}
        </div>
      </div>
      {children}
    </div>
  );
}

export default function SettingsPage() {
  const { i18n } = useTranslation();
  const { settings, update } = useSettings();

  return (
    <div className="mx-auto max-w-2xl">
      <PageHeader
        title="Settings"
        subtitle="Preferences for how AgriCast AI looks and behaves on this device."
      />

      <Card className="mt-6" padding="lg">
        <SettingRow icon={Palette} label="Theme" description="Forest green, the AgriCast AI default theme.">
          <Badge>Forest Green</Badge>
        </SettingRow>

        <SettingRow icon={Globe} label="Language" description="Applies across the whole app immediately.">
          <Select
            value={i18n.resolvedLanguage}
            onChange={(e) => i18n.changeLanguage(e.target.value)}
            className="w-36"
          >
            {SUPPORTED_LANGUAGES.map((lang) => (
              <option key={lang.code} value={lang.code}>
                {lang.label}
              </option>
            ))}
          </Select>
        </SettingRow>

        <SettingRow icon={Ruler} label="Units" description="Preferred unit system for this device.">
          <div className="relative flex rounded-full bg-neutral-900/[0.04] p-1">
            {["metric", "imperial"].map((unit) => {
              const isActive = settings.units === unit;
              return (
                <button
                  key={unit}
                  type="button"
                  onClick={() => update({ units: unit })}
                  className="focus-ring relative rounded-full px-3.5 py-1.5 text-sm font-medium capitalize transition-colors"
                >
                  {isActive && (
                    <motion.span
                      layoutId="units-pill"
                      className="absolute inset-0 rounded-full bg-gradient-to-b from-brand-500 to-brand-600 shadow-[var(--shadow-glow-brand)]"
                      transition={{ type: "spring", stiffness: 500, damping: 40 }}
                    />
                  )}
                  <span className={`relative z-10 ${isActive ? "text-white" : "text-neutral-600"}`}>{unit}</span>
                </button>
              );
            })}
          </div>
        </SettingRow>

        <SettingRow
          icon={Bell}
          label="Notifications"
          description="Weather and AI advisory alerts (device-level preference)."
        >
          <button
            type="button"
            role="switch"
            aria-checked={settings.notifications}
            onClick={() => update({ notifications: !settings.notifications })}
            className={`focus-ring h-6 w-11 rounded-full transition-colors ${
              settings.notifications ? "bg-gradient-to-r from-brand-500 to-brand-600" : "bg-neutral-300"
            }`}
          >
            <motion.span
              layout
              transition={{ type: "spring", stiffness: 500, damping: 32 }}
              className={`block h-5 w-5 translate-x-0.5 rounded-full bg-white shadow-sm ${
                settings.notifications ? "translate-x-5" : ""
              }`}
            />
          </button>
        </SettingRow>
      </Card>

      <p className="mt-4 text-xs text-neutral-400">
        Units and notifications are stored on this device only - AgriCast AI's backend doesn't
        have a settings module yet.
      </p>
    </div>
  );
}
