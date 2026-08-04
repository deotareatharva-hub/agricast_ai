// Centralized query-key factory for the farms feature, so every hook
// invalidates/reads the exact same cache entries.
export const farmKeys = {
  all: ["farms"],
  lists: () => [...farmKeys.all, "list"],
  list: (filters) => [...farmKeys.lists(), filters],
  details: () => [...farmKeys.all, "detail"],
  detail: (id) => [...farmKeys.details(), id],
};
