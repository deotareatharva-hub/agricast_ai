import { useQuery } from "@tanstack/react-query";
import { satelliteApi } from "../api/satellite.api";
import { satelliteKeys } from "./satelliteKeys";

// Primary hook consumed by SatellitePage.
// Returns combined image + metadata + health metrics in one call.
export function useSatelliteCurrent(farmId, params = {}) {
  return useQuery({
    queryKey: satelliteKeys.current(farmId, params),
    queryFn: () => satelliteApi.getCurrent(farmId, params),
    select: (response) => response.data,
    enabled: Boolean(farmId),
    staleTime: 10 * 60 * 1000, // 10 min - satellite data is slow to change
    retry: 1,
  });
}
