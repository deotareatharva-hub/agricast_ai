export const reportKeys = {
  all: ["reports"],
  lists: () => [...reportKeys.all, "list"],
  list: (params) => [...reportKeys.lists(), params],
  detail: (id) => [...reportKeys.all, "detail", id],
};
