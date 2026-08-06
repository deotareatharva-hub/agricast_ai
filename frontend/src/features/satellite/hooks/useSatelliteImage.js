import { useQuery } from "@tanstack/react-query";
import { satelliteApi } from "../api/satellite.api";
import { satelliteKeys } from "./satelliteKeys";

export function useSatelliteImage(farmId, params = {}) {
  return useQuery({
    queryKey: satelliteKeys.image(farmId, params),
    queryFn: () => satelliteApi.getImage(farmId, params),
    select: (response) => response.data,
    enabled: Boolean(farmId && params.layer),
    retry: 1,
  });
}
