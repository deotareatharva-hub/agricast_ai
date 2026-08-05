import { useQuery } from "@tanstack/react-query";
import { weatherApi } from "../api/weather.api";
import { weatherKeys } from "./weatherKeys";

export function useHourlyWeather(farmId) {
  return useQuery({
    queryKey: weatherKeys.hourly(farmId),
    queryFn: () => weatherApi.getHourly(farmId),
    select: (response) => response.data.hourly ?? [],
    enabled: Boolean(farmId),
    staleTime: 10 * 60 * 1000,
  });
}
