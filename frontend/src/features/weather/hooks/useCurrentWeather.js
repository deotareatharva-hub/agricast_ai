import { useQuery } from "@tanstack/react-query";
import { weatherApi } from "../api/weather.api";
import { weatherKeys } from "./weatherKeys";

// Current-conditions snapshot for a farm. Backend is cache-first, so this
// is cheap to refetch on tab focus if the user comes back later.
export function useCurrentWeather(farmId) {
  return useQuery({
    queryKey: weatherKeys.current(farmId),
    queryFn: () => weatherApi.getCurrent(farmId),
    select: (response) => response.data,
    enabled: Boolean(farmId),
  });
}
