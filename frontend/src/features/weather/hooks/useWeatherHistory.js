import { useQuery } from "@tanstack/react-query";
import { weatherApi } from "../api/weather.api";
import { weatherKeys } from "./weatherKeys";

export function useWeatherHistory(farmId, { startDate, endDate } = {}) {
  return useQuery({
    queryKey: weatherKeys.historyRange(farmId, { startDate, endDate }),
    queryFn: () => weatherApi.getHistory(farmId, { startDate, endDate }),
    select: (response) => response.data.history ?? [],
    enabled: Boolean(farmId) && Boolean(startDate) && Boolean(endDate),
    staleTime: 30 * 60 * 1000,
  });
}
