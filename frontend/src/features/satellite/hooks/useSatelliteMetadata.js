import { useQuery } from "@tanstack/react-query";
import { satelliteApi } from "../api/satellite.api";
import { satelliteKeys } from "./satelliteKeys";

export function useSatelliteMetadata(farmId, params = {}) {
  return useQuery({
    queryKey: satelliteKeys.metadata(farmId, params),
    queryFn: () => satelliteApi.getMetadata(farmId, params),
    select: (response) => response.data,
    enabled: Boolean(farmId && params.layer),
    retry: 1,
  });
}
