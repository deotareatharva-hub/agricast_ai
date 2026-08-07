import { useState } from "react";
import { FileDown } from "lucide-react";
import Select from "../../../components/ui/Select";
import Button from "../../../components/ui/Button";
import Card from "../../../components/ui/Card";

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
    <Card>
      <div className="flex flex-wrap items-end gap-4">
        <div>
          <label className="mb-1.5 block text-xs font-semibold text-neutral-500">Report type</label>
          <Select value={reportType} onChange={(e) => setReportType(e.target.value)} className="w-40">
            {REPORT_TYPES.map((t) => (
              <option key={t.id} value={t.id}>
                {t.label}
              </option>
            ))}
          </Select>
        </div>

        <div>
          <label className="mb-1.5 block text-xs font-semibold text-neutral-500">Format</label>
          <Select value={fileType} onChange={(e) => setFileType(e.target.value)} className="w-32">
            {FILE_TYPES.map((f) => (
              <option key={f.id} value={f.id}>
                {f.label}
              </option>
            ))}
          </Select>
        </div>

        <Button className="ml-auto" onClick={() => onGenerate({ reportType, fileType })} isLoading={isPending}>
          <FileDown className="h-4 w-4" aria-hidden="true" />
          {isPending ? "Generating…" : "Generate report"}
        </Button>
      </div>
    </Card>
  );
}
