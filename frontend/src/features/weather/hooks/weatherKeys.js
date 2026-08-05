export const weatherKeys = {
  all: ["weather"],
  farm: (farmId) => [...weatherKeys.all, farmId],

  current: (farmId) => [...weatherKeys.farm(farmId), "current"],
  hourly: (farmId) => [...weatherKeys.farm(farmId), "hourly"],
  daily: (farmId) => [...weatherKeys.farm(farmId), "daily"],

  history: (farmId) => [...weatherKeys.farm(farmId), "history"],
  historyRange: (farmId, params) => [...weatherKeys.history(farmId), params],
};
