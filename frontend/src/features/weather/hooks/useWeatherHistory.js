import { useQuery } from "@tanstack/react-query";
import { weatherApi } from "../api/weather.api";
import { weatherKeys } from "./weatherKeys";

// Past readings for a farm. Pass { startDate, endDate } (YYYY-MM-DD) to
// narrow the range; defaults to the last 7 days server-side.
export function useWeatherHistory(farmId, params = {}) {
  return useQuery({
    queryKey: weatherKeys.history(farmId, params),
    queryFn: () => weatherApi.getHistory(farmId, params),
    select: (response) => response.data.history,
    enabled: Boolean(farmId),
  });
}
