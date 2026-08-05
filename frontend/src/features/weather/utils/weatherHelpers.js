// Small, framework-free helpers shared across weather components/pages.
// Kept separate from weatherFormatters (display strings) and
// weatherCodeMap (icon/label/tone lookups) so each file has one job.

// Hourly endpoint returns the full cached block; the UI only wants the
// next 24 from "now" so the strip always starts at the current hour.
export function getUpcomingHours(hourly = [], count = 24) {
  const now = Date.now();
  const upcoming = hourly.filter((hour) => new Date(hour.time).getTime() >= now - 60 * 60 * 1000);
  return (upcoming.length > 0 ? upcoming : hourly).slice(0, count);
}

// Default date range for the History tab: the last 7 full days.
export function getDefaultHistoryRange() {
  const end = new Date();
  const start = new Date();
  start.setDate(start.getDate() - 6);
  return {
    startDate: toDateInputValue(start),
    endDate: toDateInputValue(end),
  };
}

export function toDateInputValue(date) {
  return date.toISOString().slice(0, 10);
}

// Guards against a farmer picking a start date after the end date, or a
// range further back than the backend is expected to retain.
export function clampHistoryRange(startDate, endDate, maxDays = 90) {
  if (!startDate || !endDate) return { startDate, endDate };
  const start = new Date(startDate);
  const end = new Date(endDate);
  if (start > end) return { startDate: endDate, endDate: startDate };

  const spanDays = Math.round((end - start) / (1000 * 60 * 60 * 24));
  if (spanDays > maxDays) {
    const clampedStart = new Date(end);
    clampedStart.setDate(clampedStart.getDate() - maxDays);
    return { startDate: toDateInputValue(clampedStart), endDate };
  }
  return { startDate, endDate };
}

export function average(numbers = []) {
  const valid = numbers.filter((n) => typeof n === "number" && !Number.isNaN(n));
  if (valid.length === 0) return null;
  return valid.reduce((sum, n) => sum + n, 0) / valid.length;
}

export function sum(numbers = []) {
  const valid = numbers.filter((n) => typeof n === "number" && !Number.isNaN(n));
  return valid.reduce((total, n) => total + n, 0);
}

export function maxOf(numbers = []) {
  const valid = numbers.filter((n) => typeof n === "number" && !Number.isNaN(n));
  return valid.length ? Math.max(...valid) : null;
}

export function minOf(numbers = []) {
  const valid = numbers.filter((n) => typeof n === "number" && !Number.isNaN(n));
  return valid.length ? Math.min(...valid) : null;
}

// Rain-probability -> a coarse risk band, used to color the "chance of
// rain" chip on hourly/daily cards without repeating thresholds everywhere.
export function getRainRiskLevel(probability) {
  if (probability == null) return "none";
  if (probability >= 70) return "high";
  if (probability >= 40) return "moderate";
  if (probability >= 15) return "low";
  return "none";
}

// The backend's current/hourly DTOs don't include an `isDay` flag
// (weatherMapper.js only maps Open-Meteo's numeric fields, not
// `is_day`), so day/night icon choice is inferred from the reading's own
// local hour instead of a field that will always be undefined. 6am-6pm
// counts as day - close enough for an icon choice.
export function inferIsDay(isoString) {
  if (!isoString) return true;
  const hour = new Date(isoString).getHours();
  return hour >= 6 && hour < 18;
}
