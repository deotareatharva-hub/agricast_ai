import { useState, useCallback } from "react";

const STORAGE_KEY = "agricast_settings";

const DEFAULTS = {
  units: "metric",
  notifications: true,
};

function load() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? { ...DEFAULTS, ...JSON.parse(raw) } : DEFAULTS;
  } catch {
    return DEFAULTS;
  }
}

// There is no backend settings module (see SettingsGuide/SETTINGS in the
// docs) - theme/language are already handled by Tailwind + i18next, so
// this only persists units + notification preference locally.
export function useSettings() {
  const [settings, setSettings] = useState(load);

  const update = useCallback((patch) => {
    setSettings((prev) => {
      const next = { ...prev, ...patch };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      return next;
    });
  }, []);

  return { settings, update };
}
