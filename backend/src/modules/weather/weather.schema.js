// Response DTOs for the weather module. This is deliberately separate from
// db/schema/weather.schema.js (the Drizzle table definitions) - this file
// shapes what the FRONTEND receives, so internal column names (snake_case
// DB fields, cache bookkeeping columns like fetchedAt/expiresAt) never leak
// into the public API and can change independently of the wire format.

function toCurrentDto(data, meta) {
  return {
    farmId: meta.farmId,
    observedAt: data.observedAt,
    temperature: data.temperature,
    humidity: data.humidity,
    pressure: data.pressure,
    windSpeed: data.windSpeed,
    windDirection: data.windDirection,
    uvIndex: data.uvIndex,
    weatherCode: data.weatherCode,
    units: data.units,
    cache: meta.cache,
  };
}

function toHourlyDto(list, meta) {
  return {
    farmId: meta.farmId,
    count: list.length,
    hourly: list.map((h) => ({
      time: h.time,
      temperature: h.temperature,
      humidity: h.humidity,
      rainProbability: h.rainProbability,
      pressure: h.pressure,
      windSpeed: h.windSpeed,
      windDirection: h.windDirection,
      uvIndex: h.uvIndex,
      weatherCode: h.weatherCode,
    })),
    cache: meta.cache,
  };
}

function toDailyDto(list, meta) {
  return {
    farmId: meta.farmId,
    count: list.length,
    daily: list.map((d) => ({
      date: d.date,
      temperatureMax: d.temperatureMax,
      temperatureMin: d.temperatureMin,
      rainProbabilityMax: d.rainProbabilityMax,
      windSpeedMax: d.windSpeedMax,
      windDirectionDominant: d.windDirectionDominant,
      uvIndexMax: d.uvIndexMax,
      weatherCode: d.weatherCode,
    })),
    cache: meta.cache,
  };
}

function toHistoryDto(rows, meta) {
  return {
    farmId: meta.farmId,
    count: rows.length,
    history: rows.map((row) => ({
      recordedAt: row.recordedAt,
      temperature: row.temperature,
      humidity: row.humidity,
      windSpeed: row.windSpeed,
      windDirection: row.windDirection,
      pressure: row.pressure,
      rainProbability: row.rainProbability,
      uvIndex: row.uvIndex,
      weatherCode: row.weatherCode,
      source: row.source,
    })),
  };
}

export const weatherSchema = {
  toCurrentDto,
  toHourlyDto,
  toDailyDto,
  toHistoryDto,
};
