import { useState } from "react";

const REPORT_TYPES = [
  { id: "today", label: "Today" },
  { id: "weekly", label: "Weekly" },
  { id: "monthly", label: "Monthly" },
  { id: "recommendation", label: "Recommendation" },
];

const FILE_TYPES = [
  { id: "pdf", label: "PDF" },
  { id: "csv", label: "CSV" },
  { id: "json", label: "JSON" },
];

export default function GenerateReportForm({ onGenerate, isPending }) {
  const [reportType, setReportType] = useState("today");
  const [fileType, setFileType] = useState("pdf");

  return (
    <div className="rounded-xl border border-neutral-200 bg-white p-4">
      <div className="flex flex-wrap items-end gap-4">
        <div>
          <label className="mb-1 block text-xs font-medium text-neutral-500">Report type</label>
          <select
            value={reportType}
            onChange={(e) => setReportType(e.target.value)}
            className="focus-ring rounded-md border border-neutral-300 px-3 py-2 text-sm"
          >
            {REPORT_TYPES.map((t) => (
              <option key={t.id} value={t.id}>
                {t.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="mb-1 block text-xs font-medium text-neutral-500">Format</label>
          <select
            value={fileType}
            onChange={(e) => setFileType(e.target.value)}
            className="focus-ring rounded-md border border-neutral-300 px-3 py-2 text-sm"
          >
            {FILE_TYPES.map((f) => (
              <option key={f.id} value={f.id}>
                {f.label}
              </option>
            ))}
          </select>
        </div>

        <button
          type="button"
          onClick={() => onGenerate({ reportType, fileType })}
          disabled={isPending}
          className="focus-ring ml-auto rounded-md bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700 disabled:opacity-60"
        >
          {isPending ? "Generating…" : "Generate report"}
        </button>
      </div>
    </div>
  );
}
