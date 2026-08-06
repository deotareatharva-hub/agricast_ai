import { useQuery } from "@tanstack/react-query";
import { analyticsApi } from "../api/analytics.api";
import { analyticsKeys } from "./analyticsKeys";

export function useRecommendationAnalytics(farmId, params = {}) {
  return useQuery({
    queryKey: analyticsKeys.recommendations(farmId, params),
    queryFn: () => analyticsApi.getRecommendationAnalytics(farmId, params),
    select: (response) => response.data,
    enabled: Boolean(farmId),
  });
}
