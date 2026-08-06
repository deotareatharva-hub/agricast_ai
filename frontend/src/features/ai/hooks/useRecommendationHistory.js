import { useQuery } from "@tanstack/react-query";
import { aiApi } from "../api/ai.api";
import { aiKeys } from "./aiKeys";

export function useRecommendationHistory(farmId, params = {}) {
  return useQuery({
    queryKey: aiKeys.history(farmId, params),
    queryFn: () => aiApi.getHistory(farmId, params),
    select: (response) => response.data.history || response.data,
    enabled: Boolean(farmId),
  });
}
