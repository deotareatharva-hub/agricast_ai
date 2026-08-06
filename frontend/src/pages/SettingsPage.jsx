import { useTranslation } from "react-i18next";
import { SUPPORTED_LANGUAGES } from "../i18n";
import { useSettings } from "../features/settings/useSettings";

function SettingRow({ label, description, children }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-neutral-100 py-4 last:border-b-0">
      <div>
        <div className="text-sm font-medium text-neutral-900">{label}</div>
        {description && <div className="text-xs text-neutral-500">{description}</div>}
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
      <h1 className="text-2xl font-semibold text-neutral-900">Settings</h1>
      <p className="mt-1 text-sm text-neutral-500">
        Preferences for how AgriCast AI looks and behaves on this device.
      </p>

      <div className="mt-6 rounded-xl border border-neutral-200 bg-white px-5">
        <SettingRow label="Theme" description="Forest green, the AgriCast AI default theme.">
          <span className="rounded-full bg-brand-50 px-3 py-1 text-xs font-medium text-brand-700">
            Forest Green
          </span>
        </SettingRow>

        <SettingRow label="Language" description="Applies across the whole app immediately.">
          <select
            value={i18n.resolvedLanguage}
            onChange={(e) => i18n.changeLanguage(e.target.value)}
            className="focus-ring rounded-md border border-neutral-300 px-3 py-1.5 text-sm"
          >
            {SUPPORTED_LANGUAGES.map((lang) => (
              <option key={lang.code} value={lang.code}>
                {lang.label}
              </option>
            ))}
          </select>
        </SettingRow>

        <SettingRow label="Units" description="Preferred unit system for this device.">
          <div className="flex overflow-hidden rounded-md border border-neutral-300">
            {["metric", "imperial"].map((unit) => (
              <button
                key={unit}
                type="button"
                onClick={() => update({ units: unit })}
                className={`px-3 py-1.5 text-sm font-medium capitalize ${
                  settings.units === unit
                    ? "bg-brand-600 text-white"
                    : "bg-white text-neutral-700 hover:bg-neutral-50"
                }`}
              >
                {unit}
              </button>
            ))}
          </div>
        </SettingRow>

        <SettingRow
          label="Notifications"
          description="Weather and AI advisory alerts (device-level preference)."
        >
          <button
            type="button"
            role="switch"
            aria-checked={settings.notifications}
            onClick={() => update({ notifications: !settings.notifications })}
            className={`focus-ring h-6 w-11 rounded-full transition-colors ${
              settings.notifications ? "bg-brand-600" : "bg-neutral-300"
            }`}
          >
            <span
              className={`block h-5 w-5 translate-x-0.5 rounded-full bg-white transition-transform ${
                settings.notifications ? "translate-x-5" : ""
              }`}
            />
          </button>
        </SettingRow>
      </div>

      <p className="mt-4 text-xs text-neutral-400">
        Units and notifications are stored on this device only - AgriCast AI's backend doesn't
        have a settings module yet.
      </p>
    </div>
  );
}
