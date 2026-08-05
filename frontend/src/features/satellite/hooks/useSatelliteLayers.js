import { useQuery } from "@tanstack/react-query";
import { satelliteApi } from "../api/satellite.api";
import { satelliteKeys } from "./satelliteKeys";

// Layers list is static (backed by server configuration), so we cache
// it aggressively - 1 hour stale, no background refetch.
export function useSatelliteLayers() {
  return useQuery({
    queryKey: satelliteKeys.layers(),
    queryFn: () => satelliteApi.getLayers(),
    select: (response) => response.data,
    staleTime: 60 * 60 * 1000,
  });
}
