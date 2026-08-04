// Response DTOs for the reports module. Deliberately separate from
// db/schema/reports.schema.js (the Drizzle table definition) - this file
// shapes what the FRONTEND receives, so internal columns (the raw
// metadata snapshot, generatedBy) never leak into the public API by
// accident, same separation of concerns as modules/ai/ai.schema.js.

function toReportDto(row) {
  return {
    id: row.id,
    farmId: row.farmId,
    reportType: row.reportType,
    fileType: row.fileType,
    status: row.status,
    // The frontend never sees the raw storage path - only an API route it
    // can call (with its own auth header) to stream the file. Kept as a
    // relative API path (not a full URL) so it works the same in every
    // environment without needing to know the server's own origin.
    downloadUrl: row.status === "completed" ? `/api/v1/reports/${row.id}/download` : null,
    generatedAt: row.generatedAt,
    createdAt: row.createdAt,
  };
}

function toReportDetailDto(row) {
  return {
    ...toReportDto(row),
    // Detail view additionally exposes the data snapshot the report was
    // built from (farm/weather/AI/satellite/sensor), useful for a
    // frontend "preview before download" screen. contentHash is an
    // internal dedup key and is intentionally excluded.
    data: {
      farm: row.metadata?.farm,
      weather: row.metadata?.weather,
      aiRecommendation: row.metadata?.aiRecommendation,
      satellite: row.metadata?.satellite,
      sensorSnapshot: row.metadata?.sensorSnapshot,
    },
    ...(row.status === "failed" ? { error: row.metadata?.error } : {}),
  };
}

function toListDto(rows, meta) {
  return {
    farmId: meta.farmId ?? null,
    count: rows.length,
    reports: rows.map(toReportDto),
  };
}

export const reportsSchema = {
  toReportDto,
  toReportDetailDto,
  toListDto,
};
