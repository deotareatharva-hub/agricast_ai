import { useQuery } from "@tanstack/react-query";
import { satelliteApi } from "../api/satellite.api";
import { satelliteKeys } from "./satelliteKeys";

export function useSatelliteLayers() {
  return useQuery({
    queryKey: satelliteKeys.layers(),
    queryFn: () => satelliteApi.getLayers(),
    select: (response) => response.data.layers,
    staleTime: Infinity,
  });
}
