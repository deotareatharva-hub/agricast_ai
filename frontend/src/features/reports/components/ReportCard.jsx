const TYPE_LABELS = {
  today: "Today",
  weekly: "Weekly",
  monthly: "Monthly",
  recommendation: "Recommendation",
};

export default function ReportCard({ report, onDownload, onDelete, isDownloading, isDeleting }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-neutral-200 bg-white px-4 py-3">
      <div>
        <div className="flex items-center gap-2">
          <span className="rounded-full bg-brand-50 px-2 py-0.5 text-xs font-semibold text-brand-700">
            {TYPE_LABELS[report.reportType] || report.reportType}
          </span>
          <span className="text-xs uppercase text-neutral-400">{report.fileType}</span>
        </div>
        <p className="mt-1 text-xs text-neutral-500">
          Generated {new Date(report.generatedAt || report.createdAt).toLocaleString([], {
            dateStyle: "medium",
            timeStyle: "short",
          })}
        </p>
      </div>

      <div className="flex shrink-0 gap-2">
        <button
          type="button"
          onClick={onDownload}
          disabled={isDownloading}
          className="focus-ring rounded-md border border-neutral-300 px-3 py-1.5 text-sm font-medium text-neutral-700 hover:bg-neutral-50 disabled:opacity-60"
        >
          {isDownloading ? "Downloading…" : "Download"}
        </button>
        <button
          type="button"
          onClick={onDelete}
          disabled={isDeleting}
          className="focus-ring rounded-md border border-red-200 px-3 py-1.5 text-sm font-medium text-red-600 hover:bg-red-50 disabled:opacity-60"
        >
          Delete
        </button>
      </div>
    </div>
  );
}
