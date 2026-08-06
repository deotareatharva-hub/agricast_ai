export const weatherKeys = {
  all: ["weather"],
  current: (farmId) => [...weatherKeys.all, "current", farmId],
  hourly: (farmId) => [...weatherKeys.all, "hourly", farmId],
  daily: (farmId) => [...weatherKeys.all, "daily", farmId],
  history: (farmId, params) => [...weatherKeys.all, "history", farmId, params],
};
