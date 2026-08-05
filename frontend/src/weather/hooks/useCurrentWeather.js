import { useQuery } from "@tanstack/react-query";
import { weatherApi } from "../api/weather.api";
import { weatherKeys } from "../weatherKeys";

export function useCurrentWeather(farmId) {
  return useQuery({
    queryKey: weatherKeys.current(farmId),

    queryFn: () => weatherApi.current(farmId),

    enabled: !!farmId,

    staleTime: 5 * 60 * 1000,

    retry: 1,
  });
}