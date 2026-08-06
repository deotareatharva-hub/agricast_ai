import { useQuery } from "@tanstack/react-query";
import { weatherApi } from "../api/weather.api";
import { weatherKeys } from "./weatherKeys";

// Next 24 hours for a farm.
export function useHourlyWeather(farmId) {
  return useQuery({
    queryKey: weatherKeys.hourly(farmId),
    queryFn: () => weatherApi.getHourly(farmId),
    select: (response) => response.data.hourly,
    enabled: Boolean(farmId),
  });
}
