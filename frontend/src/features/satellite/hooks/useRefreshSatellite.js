import { useMutation, useQueryClient } from "@tanstack/react-query";
import { satelliteApi } from "../api/satellite.api";
import { satelliteKeys } from "./satelliteKeys";

// Invalidates all satellite queries for the farm after a successful refresh,
// forcing each panel to re-fetch fresh imagery from the backend.
export function useRefreshSatellite(farmId) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => satelliteApi.refreshCache(farmId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: satelliteKeys.farm(farmId) });
    },
  });
}
