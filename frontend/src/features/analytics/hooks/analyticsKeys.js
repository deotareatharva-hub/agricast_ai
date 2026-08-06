export const analyticsKeys = {
  all: ["analytics"],
  dashboard: (farmId) => [...analyticsKeys.all, "dashboard", farmId],
  weather: (farmId, params) => [...analyticsKeys.all, "weather", farmId, params],
  recommendations: (farmId, params) => [...analyticsKeys.all, "recommendations", farmId, params],
};
