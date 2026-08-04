import { useQuery } from "@tanstack/react-query";
import { farmApi } from "../api/farm.api";
import { farmKeys } from "./farmKeys";

// Cached single farm, keyed by id. Disabled until an id is available so
// callers can safely mount this before route params resolve.
export function useFarm(id) {
  return useQuery({
    queryKey: farmKeys.detail(id),
    queryFn: () => farmApi.getById(id),
    select: (response) => response.data.farm,
    enabled: Boolean(id),
  });
}
