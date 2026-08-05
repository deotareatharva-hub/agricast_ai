import { useQuery } from "@tanstack/react-query";
import { weatherApi } from "../api/weather.api";
import { weatherKeys } from "./weatherKeys";

export function useDailyWeather(farmId) {
  return useQuery({
    queryKey: weatherKeys.daily(farmId),
    queryFn: () => weatherApi.getDaily(farmId),
    select: (response) => response.data.daily ?? [],
    enabled: Boolean(farmId),
    staleTime: 30 * 60 * 1000,
  });
}
