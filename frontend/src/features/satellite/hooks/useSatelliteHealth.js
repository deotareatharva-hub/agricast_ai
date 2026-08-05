import { useQuery } from "@tanstack/react-query";
import { satelliteApi } from "../api/satellite.api";
import { satelliteKeys } from "./satelliteKeys";

export function useSatelliteHealth(farmId, params = {}) {
  return useQuery({
    queryKey: satelliteKeys.health(farmId, params),
    queryFn: () => satelliteApi.getHealth(farmId, params),
    select: (response) => response.data,
    enabled: Boolean(farmId),
    staleTime: 10 * 60 * 1000,
    retry: 1,
  });
}
