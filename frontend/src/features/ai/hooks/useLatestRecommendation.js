import { useQuery } from "@tanstack/react-query";
import { aiApi } from "../api/ai.api";
import { aiKeys } from "./aiKeys";

export function useLatestRecommendation(farmId) {
  return useQuery({
    queryKey: aiKeys.latest(farmId),
    queryFn: () => aiApi.getLatest(farmId),
    select: (response) => response.data.recommendation,
    enabled: Boolean(farmId),
  });
}
