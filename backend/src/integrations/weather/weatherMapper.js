// Translates Open-Meteo's raw response shape (column-oriented arrays keyed
// by field name) into the row-oriented internal shape the rest of the app
// works with. This isolates every other module from Open-Meteo's specific
// field names (e.g. `temperature_2m`, `weather_code`) - if the provider
// changes or a second provider is added later, only this file changes.

function pickAt(hourly, field, index) {
  const arr = hourly?.[field];
  return Array.isArray(arr) ? arr[index] ?? null : null;
}

export const weatherMapper = {
  // Raw Open-Meteo `current` block -> flat internal current-weather object.
  mapCurrent: (raw) => {
    const current = raw?.current;
    if (!current) return null;

    return {
      observedAt: current.time ?? null,
      temperature: current.temperature_2m ?? null,
      humidity: current.relative_humidity_2m ?? null,
      pressure: current.surface_pressure ?? null,
      windSpeed: current.wind_speed_10m ?? null,
      windDirection: current.wind_direction_10m ?? null,
      uvIndex: current.uv_index ?? null,
      weatherCode: current.weather_code ?? null,
      units: {
        temperature: raw?.current_units?.temperature_2m ?? "\u00b0C",
        humidity: raw?.current_units?.relative_humidity_2m ?? "%",
        pressure: raw?.current_units?.surface_pressure ?? "hPa",
        windSpeed: raw?.current_units?.wind_speed_10m ?? "km/h",
      },
    };
  },

  // Raw Open-Meteo `hourly` block -> array of per-hour readings.
  mapHourly: (raw) => {
    const hourly = raw?.hourly;
    if (!hourly?.time) return [];

    return hourly.time.map((time, index) => ({
      time,
      temperature: pickAt(hourly, "temperature_2m", index),
      humidity: pickAt(hourly, "relative_humidity_2m", index),
      rainProbability: pickAt(hourly, "precipitation_probability", index),
      pressure: pickAt(hourly, "surface_pressure", index),
      windSpeed: pickAt(hourly, "wind_speed_10m", index),
      windDirection: pickAt(hourly, "wind_direction_10m", index),
      uvIndex: pickAt(hourly, "uv_index", index),
      weatherCode: pickAt(hourly, "weather_code", index),
    }));
  },

  // Raw Open-Meteo `daily` block -> array of per-day summaries.
  mapDaily: (raw) => {
    const daily = raw?.daily;
    if (!daily?.time) return [];

    return daily.time.map((date, index) => ({
      date,
      temperatureMax: pickAt(daily, "temperature_2m_max", index),
      temperatureMin: pickAt(daily, "temperature_2m_min", index),
      rainProbabilityMax: pickAt(daily, "precipitation_probability_max", index),
      windSpeedMax: pickAt(daily, "wind_speed_10m_max", index),
      windDirectionDominant: pickAt(daily, "wind_direction_10m_dominant", index),
      uvIndexMax: pickAt(daily, "uv_index_max", index),
      weatherCode: pickAt(daily, "weather_code", index),
    }));
  },

  // Archive API response (hourly only) -> same shape as mapHourly, reused
  // for the /history endpoint.
  mapHistory: (raw) => weatherMapper.mapHourly(raw),
};
