import { motion } from "framer-motion";
import { Download, Trash2 } from "lucide-react";
import Badge from "../../../components/ui/Badge";
import Button from "../../../components/ui/Button";

const TYPE_LABELS = {
  today: "Today",
  weekly: "Weekly",
  monthly: "Monthly",
  recommendation: "Recommendation",
};

export default function ReportCard({ report, onDownload, onDelete, isDownloading, isDeleting }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-neutral-900/[0.06] bg-white px-4 py-3.5 shadow-[var(--shadow-soft-sm)]"
    >
      <div>
        <div className="flex items-center gap-2">
          <Badge>{TYPE_LABELS[report.reportType] || report.reportType}</Badge>
          <span className="text-xs font-semibold uppercase text-neutral-400">{report.fileType}</span>
        </div>
        <p className="mt-1.5 text-xs text-neutral-400">
          Generated {new Date(report.generatedAt || report.createdAt).toLocaleString([], {
            dateStyle: "medium",
            timeStyle: "short",
          })}
        </p>
      </div>

      <div className="flex shrink-0 gap-2">
        <Button variant="outline" size="sm" onClick={onDownload} isLoading={isDownloading}>
          <Download className="h-3.5 w-3.5" aria-hidden="true" />
          {isDownloading ? "Downloading…" : "Download"}
        </Button>
        <Button variant="dangerOutline" size="sm" onClick={onDelete} isLoading={isDeleting}>
          <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
          Delete
        </Button>
      </div>
    </motion.div>
  );
}
