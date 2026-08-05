import { useQuery } from "@tanstack/react-query";
import { satelliteApi } from "../api/satellite.api";
import { satelliteKeys } from "./satelliteKeys";

export function useSatelliteHistory(farmId, params = {}) {
  return useQuery({
    queryKey: satelliteKeys.history(farmId, params),
    queryFn: () => satelliteApi.getHistory(farmId, params),
    select: (response) => response.data,
    enabled: Boolean(farmId),
    staleTime: 15 * 60 * 1000,
    retry: 1,
  });
}
