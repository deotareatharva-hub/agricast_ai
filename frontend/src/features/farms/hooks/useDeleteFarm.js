import { useMutation, useQueryClient } from "@tanstack/react-query";
import { farmApi } from "../api/farm.api";
import { farmKeys } from "./farmKeys";

export function useDeleteFarm() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id) => farmApi.remove(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: farmKeys.lists() });
    },
  });
}
