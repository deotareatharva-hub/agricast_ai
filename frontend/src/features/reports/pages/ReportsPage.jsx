import { useOutletContext } from "react-router-dom";
import { toast } from "react-toastify";
import { FileText } from "lucide-react";
import { useReports } from "../hooks/useReports";
import { useGenerateReport } from "../hooks/useGenerateReport";
import { useDeleteReport } from "../hooks/useDeleteReport";
import { useDownloadReport } from "../hooks/useDownloadReport";
import GenerateReportForm from "../components/GenerateReportForm";
import ReportCard from "../components/ReportCard";
import Loading from "../../../components/common/Loading";
import ErrorState from "../../../components/common/ErrorState";
import EmptyState from "../../../components/ui/EmptyState";

export default function ReportsPage() {
  const { farm } = useOutletContext();

  const reportsQuery = useReports({ farmId: farm.id });
  const generate = useGenerateReport();
  const remove = useDeleteReport();
  const download = useDownloadReport();

  const handleGenerate = async ({ reportType, fileType }) => {
    try {
      await generate.mutateAsync({ farmId: farm.id, reportType, fileType });
      toast.success("Report ready");
    } catch (err) {
      toast.error(err.message || "Could not generate the report.");
    }
  };

  const handleDownload = async (report) => {
    try {
      await download.mutateAsync({
        id: report.id,
        fileName: `${farm.farmName}-${report.reportType}.${report.fileType}`,
      });
    } catch (err) {
      toast.error(err.message || "Could not download the report.");
    }
  };

  const handleDelete = async (report) => {
    try {
      await remove.mutateAsync(report.id);
      toast.success("Report deleted");
    } catch (err) {
      toast.error(err.message || "Could not delete the report.");
    }
  };

  return (
    <div className="space-y-6">
      <GenerateReportForm onGenerate={handleGenerate} isPending={generate.isPending} />

      <div>
        <h2 className="mb-3 text-xs font-bold uppercase tracking-wider text-neutral-400">
          Report history
        </h2>

        {reportsQuery.isLoading ? (
          <Loading label="Loading reports…" />
        ) : reportsQuery.isError ? (
          <ErrorState
            message={reportsQuery.error?.message || "Could not load reports."}
            onRetry={() => reportsQuery.refetch()}
          />
        ) : !reportsQuery.data?.length ? (
          <EmptyState
            icon={FileText}
            title="No reports yet"
            description="Generate one above to get a downloadable PDF, CSV, or JSON summary of this farm."
          />
        ) : (
          <div className="space-y-3">
            {reportsQuery.data.map((report) => (
              <ReportCard
                key={report.id}
                report={report}
                onDownload={() => handleDownload(report)}
                onDelete={() => handleDelete(report)}
                isDownloading={download.isPending && download.variables?.id === report.id}
                isDeleting={remove.isPending && remove.variables === report.id}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
