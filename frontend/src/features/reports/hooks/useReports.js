import { useQuery } from "@tanstack/react-query";
import { reportsApi } from "../api/reports.api";
import { reportKeys } from "./reportKeys";

export function useReports(params = {}) {
  return useQuery({
    queryKey: reportKeys.list(params),
    queryFn: () => reportsApi.list(params),
    select: (response) => response.data.reports || response.data,
  });
}
