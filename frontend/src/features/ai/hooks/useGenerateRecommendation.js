import { useMutation, useQueryClient } from "@tanstack/react-query";
import { aiApi } from "../api/ai.api";
import { aiKeys } from "./aiKeys";

// Kicks off a new AI recommendation for a farm. On success, invalidates
// the latest + history caches so the page reflects the new result.
export function useGenerateRecommendation(farmId) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload) => aiApi.recommend({ farmId, ...payload }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: aiKeys.latest(farmId) });
      queryClient.invalidateQueries({ queryKey: aiKeys.all });
    },
  });
}
