// Backend is expected to send temperature in Celsius, wind speed in
// km/h, and pressure in hPa (Open-Meteo's metric defaults) - the units
// farmers in this app's target regions (see i18n/locales: en/hi/mr)
// already think in. If the backend ever sends different units, this file
// is the single place to adjust.

export function formatTemperature(value, { withUnit = true } = {}) {
  if (value == null || Number.isNaN(value)) return "–";
  const rounded = Math.round(value);
  return withUnit ? `${rounded}°C` : `${rounded}°`;
}

export function formatPercent(value) {
  if (value == null || Number.isNaN(value)) return "–";
  return `${Math.round(value)}%`;
}

export function formatWindSpeed(value) {
  if (value == null || Number.isNaN(value)) return "–";
  return `${Math.round(value)} km/h`;
}

export function formatPressure(value) {
  if (value == null || Number.isNaN(value)) return "–";
  return `${Math.round(value)} hPa`;
}

export function formatUvIndex(value) {
  if (value == null || Number.isNaN(value)) return "–";
  return value.toFixed(1).replace(/\.0$/, "");
}

export function formatVisibility(meters) {
  if (meters == null || Number.isNaN(meters)) return "–";
  return `${(meters / 1000).toFixed(1)} km`;
}

export function formatRainfall(mm) {
  if (mm == null || Number.isNaN(mm)) return "–";
  return `${mm.toFixed(1)} mm`;
}

// 16-point compass rose from a wind-direction degree.
const COMPASS_POINTS = [
  "N", "NNE", "NE", "ENE", "E", "ESE", "SE", "SSE",
  "S", "SSW", "SW", "WSW", "W", "WNW", "NW", "NNW",
];

export function getCompassDirection(degrees) {
  if (degrees == null || Number.isNaN(degrees)) return "–";
  const index = Math.round(degrees / 22.5) % 16;
  return COMPASS_POINTS[index];
}

export function formatHour(isoString, locale = "en") {
  if (!isoString) return "–";
  const date = new Date(isoString);
  return new Intl.DateTimeFormat(locale, { hour: "numeric" }).format(date);
}

export function formatDayLabel(isoDate, locale = "en", { short = true } = {}) {
  if (!isoDate) return "–";
  const date = new Date(isoDate);
  return new Intl.DateTimeFormat(locale, { weekday: short ? "short" : "long" }).format(date);
}

export function formatFullDate(isoDate, locale = "en") {
  if (!isoDate) return "–";
  const date = new Date(isoDate);
  return new Intl.DateTimeFormat(locale, { day: "numeric", month: "short" }).format(date);
}

// Weather history is a series of individual readings (recordedAt), not
// one entry per day, so chart x-axis labels need both the day and the
// hour to stay distinguishable - e.g. "5 Aug, 10 AM".
export function formatChartLabel(isoString, locale = "en") {
  if (!isoString) return "–";
  const date = new Date(isoString);
  return new Intl.DateTimeFormat(locale, { day: "numeric", month: "short", hour: "numeric" }).format(date);
}

export function formatDateTime(isoString, locale = "en") {
  if (!isoString) return "–";
  const date = new Date(isoString);
  return new Intl.DateTimeFormat(locale, {
    day: "numeric",
    month: "short",
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
}

export function formatTime(isoString, locale = "en") {
  if (!isoString) return "–";
  const date = new Date(isoString);
  return new Intl.DateTimeFormat(locale, { hour: "numeric", minute: "2-digit" }).format(date);
}

// react-i18next language codes ("en", "hi", "mr") map straight onto BCP-47
// locale tags for Intl, so no translation table is needed here.
export function toIntlLocale(i18nLanguage) {
  return i18nLanguage || "en";
}
