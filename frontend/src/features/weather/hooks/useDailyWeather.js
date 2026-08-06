import { useQuery } from "@tanstack/react-query";
import { weatherApi } from "../api/weather.api";
import { weatherKeys } from "./weatherKeys";

// Next 7 days for a farm.
export function useDailyWeather(farmId) {
  return useQuery({
    queryKey: weatherKeys.daily(farmId),
    queryFn: () => weatherApi.getDaily(farmId),
    select: (response) => response.data.daily,
    enabled: Boolean(farmId),
  });
}
