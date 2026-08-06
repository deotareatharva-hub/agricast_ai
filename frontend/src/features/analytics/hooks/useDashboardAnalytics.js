import { useQuery } from "@tanstack/react-query";
import { analyticsApi } from "../api/analytics.api";
import { analyticsKeys } from "./analyticsKeys";

export function useDashboardAnalytics(farmId) {
  return useQuery({
    queryKey: analyticsKeys.dashboard(farmId),
    queryFn: () => analyticsApi.getDashboard(farmId),
    select: (response) => response.data,
    enabled: Boolean(farmId),
  });
}
