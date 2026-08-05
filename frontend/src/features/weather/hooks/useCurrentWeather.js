import { useQuery } from "@tanstack/react-query";
import { weatherApi } from "../api/weather.api";
import { weatherKeys } from "./weatherKeys";

// The backend DTO (weather.schema.js toCurrentDto) is flat - farmId/
// observedAt/temperature/etc. sit directly on `data`, there's no extra
// `current` wrapper key.
export function useCurrentWeather(farmId) {
  return useQuery({
    queryKey: weatherKeys.current(farmId),
    queryFn: () => weatherApi.getCurrent(farmId),
    select: (response) => response.data,
    enabled: Boolean(farmId),
    staleTime: 5 * 60 * 1000,
    refetchInterval: 10 * 60 * 1000,
  });
}
