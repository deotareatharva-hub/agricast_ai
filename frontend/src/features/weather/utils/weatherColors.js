// Maps a weather "tone" (from weatherCodeMap.getWeatherTone) to the
// gradient/glass treatment used across the Weather module. Kept as one
// table so WeatherHero, HourlyForecast and SevenDayForecast all agree on
// what "rain" or "storm" looks like, instead of each picking its own
// gradient. Every gradient stays inside the forest-green brand family
// (see index.css @theme) with just enough hue shift to read as distinct
// weather, so the module still feels like the rest of the app.
const TONE_GRADIENTS = {
  clear: "from-brand-500 via-brand-600 to-brand-800",
  cloudy: "from-neutral-500 via-neutral-600 to-brand-800",
  fog: "from-neutral-400 via-neutral-500 to-neutral-700",
  rain: "from-sky-alert-500 via-brand-700 to-brand-900",
  storm: "from-neutral-700 via-brand-800 to-neutral-900",
  snow: "from-sky-alert-500 via-neutral-500 to-brand-800",
};

const TONE_ACCENT_TEXT = {
  clear: "text-brand-600",
  cloudy: "text-neutral-600",
  fog: "text-neutral-500",
  rain: "text-sky-alert-500",
  storm: "text-danger-500",
  snow: "text-sky-alert-500",
};

const TONE_ACCENT_BG = {
  clear: "bg-brand-50 text-brand-700",
  cloudy: "bg-neutral-100 text-neutral-700",
  fog: "bg-neutral-100 text-neutral-600",
  rain: "bg-blue-50 text-sky-alert-500",
  storm: "bg-red-50 text-danger-500",
  snow: "bg-blue-50 text-sky-alert-500",
};

export function getToneGradient(tone) {
  return TONE_GRADIENTS[tone] ?? TONE_GRADIENTS.cloudy;
}

export function getToneAccentText(tone) {
  return TONE_ACCENT_TEXT[tone] ?? TONE_ACCENT_TEXT.cloudy;
}

export function getToneAccentBg(tone) {
  return TONE_ACCENT_BG[tone] ?? TONE_ACCENT_BG.cloudy;
}

// UV index -> { labelKey, fallbackLabel, className } following the
// standard WHO UV scale bands used by most weather providers.
export function getUvBand(uv) {
  if (uv == null) return { labelKey: "unknown", fallbackLabel: "–", className: "text-neutral-500" };
  if (uv < 3) return { labelKey: "low", fallbackLabel: "Low", className: "text-brand-600" };
  if (uv < 6) return { labelKey: "moderate", fallbackLabel: "Moderate", className: "text-warn-500" };
  if (uv < 8) return { labelKey: "high", fallbackLabel: "High", className: "text-soil-500" };
  if (uv < 11) return { labelKey: "veryHigh", fallbackLabel: "Very high", className: "text-danger-500" };
  return { labelKey: "extreme", fallbackLabel: "Extreme", className: "text-danger-500" };
}
