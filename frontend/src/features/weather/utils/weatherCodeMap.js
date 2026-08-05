import {
  Sun,
  Moon,
  CloudSun,
  CloudMoon,
  Cloud,
  Cloudy,
  CloudFog,
  CloudDrizzle,
  CloudRain,
  CloudRainWind,
  CloudSnow,
  Snowflake,
  CloudLightning,
  CloudHail,
  HelpCircle,
} from "lucide-react";

// Open-Meteo / WMO weather-interpretation codes, the standard the backend
// is expected to pass through unchanged (see WeatherIntegrationChecklist.md).
// Each entry gives everything a UI needs to render a code: an icon per
// day/night, a translation key (resolved via i18n at call sites, falling
// back to `fallbackLabel` if the key is missing), and a `tone` used to
// pick gradient/background treatments in weatherColors.js.
const WEATHER_CODE_MAP = {
  0: { key: "clearSky", fallbackLabel: "Clear sky", dayIcon: Sun, nightIcon: Moon, tone: "clear" },
  1: { key: "mainlyClear", fallbackLabel: "Mainly clear", dayIcon: CloudSun, nightIcon: CloudMoon, tone: "clear" },
  2: { key: "partlyCloudy", fallbackLabel: "Partly cloudy", dayIcon: CloudSun, nightIcon: CloudMoon, tone: "cloudy" },
  3: { key: "overcast", fallbackLabel: "Overcast", dayIcon: Cloudy, nightIcon: Cloudy, tone: "cloudy" },
  45: { key: "fog", fallbackLabel: "Fog", dayIcon: CloudFog, nightIcon: CloudFog, tone: "fog" },
  48: { key: "rimeFog", fallbackLabel: "Depositing rime fog", dayIcon: CloudFog, nightIcon: CloudFog, tone: "fog" },
  51: { key: "lightDrizzle", fallbackLabel: "Light drizzle", dayIcon: CloudDrizzle, nightIcon: CloudDrizzle, tone: "rain" },
  53: { key: "moderateDrizzle", fallbackLabel: "Moderate drizzle", dayIcon: CloudDrizzle, nightIcon: CloudDrizzle, tone: "rain" },
  55: { key: "denseDrizzle", fallbackLabel: "Dense drizzle", dayIcon: CloudDrizzle, nightIcon: CloudDrizzle, tone: "rain" },
  56: { key: "lightFreezingDrizzle", fallbackLabel: "Light freezing drizzle", dayIcon: CloudDrizzle, nightIcon: CloudDrizzle, tone: "rain" },
  57: { key: "denseFreezingDrizzle", fallbackLabel: "Dense freezing drizzle", dayIcon: CloudDrizzle, nightIcon: CloudDrizzle, tone: "rain" },
  61: { key: "slightRain", fallbackLabel: "Slight rain", dayIcon: CloudRain, nightIcon: CloudRain, tone: "rain" },
  63: { key: "moderateRain", fallbackLabel: "Moderate rain", dayIcon: CloudRain, nightIcon: CloudRain, tone: "rain" },
  65: { key: "heavyRain", fallbackLabel: "Heavy rain", dayIcon: CloudRainWind, nightIcon: CloudRainWind, tone: "rain" },
  66: { key: "lightFreezingRain", fallbackLabel: "Light freezing rain", dayIcon: CloudRain, nightIcon: CloudRain, tone: "rain" },
  67: { key: "heavyFreezingRain", fallbackLabel: "Heavy freezing rain", dayIcon: CloudRainWind, nightIcon: CloudRainWind, tone: "rain" },
  71: { key: "slightSnow", fallbackLabel: "Slight snow fall", dayIcon: CloudSnow, nightIcon: CloudSnow, tone: "snow" },
  73: { key: "moderateSnow", fallbackLabel: "Moderate snow fall", dayIcon: CloudSnow, nightIcon: CloudSnow, tone: "snow" },
  75: { key: "heavySnow", fallbackLabel: "Heavy snow fall", dayIcon: Snowflake, nightIcon: Snowflake, tone: "snow" },
  77: { key: "snowGrains", fallbackLabel: "Snow grains", dayIcon: Snowflake, nightIcon: Snowflake, tone: "snow" },
  80: { key: "slightRainShowers", fallbackLabel: "Slight rain showers", dayIcon: CloudRain, nightIcon: CloudRain, tone: "rain" },
  81: { key: "moderateRainShowers", fallbackLabel: "Moderate rain showers", dayIcon: CloudRain, nightIcon: CloudRain, tone: "rain" },
  82: { key: "violentRainShowers", fallbackLabel: "Violent rain showers", dayIcon: CloudRainWind, nightIcon: CloudRainWind, tone: "storm" },
  85: { key: "slightSnowShowers", fallbackLabel: "Slight snow showers", dayIcon: CloudSnow, nightIcon: CloudSnow, tone: "snow" },
  86: { key: "heavySnowShowers", fallbackLabel: "Heavy snow showers", dayIcon: Snowflake, nightIcon: Snowflake, tone: "snow" },
  95: { key: "thunderstorm", fallbackLabel: "Thunderstorm", dayIcon: CloudLightning, nightIcon: CloudLightning, tone: "storm" },
  96: { key: "thunderstormHail", fallbackLabel: "Thunderstorm with slight hail", dayIcon: CloudHail, nightIcon: CloudHail, tone: "storm" },
  99: { key: "thunderstormHeavyHail", fallbackLabel: "Thunderstorm with heavy hail", dayIcon: CloudHail, nightIcon: CloudHail, tone: "storm" },
};

const FALLBACK_ENTRY = {
  key: "unknown",
  fallbackLabel: "Unknown",
  dayIcon: HelpCircle,
  nightIcon: HelpCircle,
  tone: "cloudy",
};

export function getWeatherCodeEntry(code) {
  return WEATHER_CODE_MAP[code] ?? FALLBACK_ENTRY;
}

// `isDay` accepts booleans or the 0/1 the backend/Open-Meteo commonly send.
export function getWeatherIcon(code, isDay = true) {
  const entry = getWeatherCodeEntry(code);
  return isDay ? entry.dayIcon : entry.nightIcon;
}

// `t` is the react-i18next translate function; pass it to get a localized
// label ("weather.conditions.<key>"), falling back to the English label
// when a translation is missing (e.g. a code newer than the locale files).
export function getWeatherLabel(code, t) {
  const entry = getWeatherCodeEntry(code);
  if (!t) return entry.fallbackLabel;
  return t(`weather.conditions.${entry.key}`, { defaultValue: entry.fallbackLabel });
}

export function getWeatherTone(code) {
  return getWeatherCodeEntry(code).tone;
}
