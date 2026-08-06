import { useMutation } from "@tanstack/react-query";
import { reportsApi } from "../api/reports.api";

// Triggers a browser download for a report file. Not a query - this is a
// one-off side effect (create object URL, click a temp link, revoke it).
export function useDownloadReport() {
  return useMutation({
    mutationFn: async ({ id, fileName }) => {
      const { blob } = await reportsApi.download(id);
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
    },
  });
}
