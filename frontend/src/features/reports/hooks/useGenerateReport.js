import { useMutation, useQueryClient } from "@tanstack/react-query";
import { reportsApi } from "../api/reports.api";
import { reportKeys } from "./reportKeys";

export function useGenerateReport() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload) => reportsApi.generate(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: reportKeys.lists() });
    },
  });
}
