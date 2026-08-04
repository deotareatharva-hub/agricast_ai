import { useQuery } from "@tanstack/react-query";
import { farmApi } from "../api/farm.api";
import { farmKeys } from "./farmKeys";

// Cached list of the current user's farms. Pass { search, crop } to filter;
// changing filters produces a distinct cache entry via farmKeys.list().
export function useFarms(filters = {}) {
  return useQuery({
    queryKey: farmKeys.list(filters),
    queryFn: () => farmApi.list(filters),
    select: (response) => response.data.farms,
  });
}
