import { useMutation, useQueryClient } from "@tanstack/react-query";
import { farmApi } from "../api/farm.api";
import { farmKeys } from "./farmKeys";

export function useCreateFarm() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload) => farmApi.create(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: farmKeys.lists() });
    },
  });
}
