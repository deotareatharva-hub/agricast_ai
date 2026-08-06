import { useQuery } from "@tanstack/react-query";
import { analyticsApi } from "../api/analytics.api";
import { analyticsKeys } from "./analyticsKeys";

export function useWeatherAnalytics(farmId, params = {}) {
  return useQuery({
    queryKey: analyticsKeys.weather(farmId, params),
    queryFn: () => analyticsApi.getWeatherAnalytics(farmId, params),
    select: (response) => response.data,
    enabled: Boolean(farmId),
  });
}
