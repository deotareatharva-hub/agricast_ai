import { useMutation, useQueryClient } from "@tanstack/react-query";
import { farmApi } from "../api/farm.api";
import { farmKeys } from "./farmKeys";

export function useUpdateFarm() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, payload }) => farmApi.update(id, payload),
    onSuccess: (_response, variables) => {
      queryClient.invalidateQueries({ queryKey: farmKeys.lists() });
      queryClient.invalidateQueries({ queryKey: farmKeys.detail(variables.id) });
    },
  });
}
