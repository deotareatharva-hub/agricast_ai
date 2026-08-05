export const weatherKeys = {
  all: ["weather"],

  current: (farmId) => ["weather", "current", farmId],

  hourly: (farmId) => ["weather", "hourly", farmId],

  daily: (farmId) => ["weather", "daily", farmId],

  history: (farmId, filters = {}) => [
    "weather",
    "history",
    farmId,
    filters,
  ],
};