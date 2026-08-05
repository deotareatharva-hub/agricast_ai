import { useQuery } from "@tanstack/react-query";
import { satelliteApi } from "../api/satellite.api";
import { satelliteKeys } from "./satelliteKeys";

export function useSatelliteNdvi(farmId, params = {}) {
  return useQuery({
    queryKey: satelliteKeys.ndvi(farmId, params),
    queryFn: () => satelliteApi.getNdvi(farmId, params),
    select: (response) => response.data,
    enabled: Boolean(farmId),
    staleTime: 10 * 60 * 1000,
    retry: 1,
  });
}
