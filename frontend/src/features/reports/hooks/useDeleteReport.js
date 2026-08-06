import { useMutation, useQueryClient } from "@tanstack/react-query";
import { reportsApi } from "../api/reports.api";
import { reportKeys } from "./reportKeys";

export function useDeleteReport() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id) => reportsApi.remove(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: reportKeys.lists() });
    },
  });
}
