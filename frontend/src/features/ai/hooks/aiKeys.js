export const aiKeys = {
  all: ["ai"],
  latest: (farmId) => [...aiKeys.all, "latest", farmId],
  history: (farmId, params) => [...aiKeys.all, "history", farmId, params],
};
