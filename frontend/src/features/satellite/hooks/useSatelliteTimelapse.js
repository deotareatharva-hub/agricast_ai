import { useQuery } from "@tanstack/react-query";
import { satelliteApi } from "../api/satellite.api";
import { satelliteKeys } from "./satelliteKeys";

export function useSatelliteTimelapse(farmId, layer = "TRUE_COLOR") {
  return useQuery({
    queryKey: satelliteKeys.timelapse(farmId, layer),
    queryFn: () => satelliteApi.getTimelapse(farmId, { layer }),
    select: (response) => response.data,
    enabled: Boolean(farmId),
    staleTime: 15 * 60 * 1000,
    retry: 1,
  });
}
