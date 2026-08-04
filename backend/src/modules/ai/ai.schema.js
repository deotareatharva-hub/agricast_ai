// Response DTOs for the AI module. Deliberately separate from
// db/schema/recommendations.schema.js (the Drizzle table definition) - this
// file shapes what the FRONTEND receives, so internal columns (prompt,
// rawResponse, the raw snapshot blobs) never leak into the public API by
// accident. Same separation of concerns as modules/weather/weather.schema.js
// and modules/satellite/satellite.schema.js.

function toRecommendationDto(row) {
  return {
    id: row.id,
    farmId: row.farmId,
    language: row.language,
    confidence: row.confidence,
    createdAt: row.createdAt,
    // parsedResponse already carries summary/irrigation/harvest/
    // diseaseRisk/alerts/nextReview in the exact strict-JSON shape the
    // engine produced - re-spread rather than re-typed so the DTO can
    // never drift out of sync with what recommendationValidator.js
    // actually guarantees.
    ...row.parsedResponse,
  };
}

function toHistoryDto(rows, meta) {
  return {
    farmId: meta.farmId,
    count: rows.length,
    recommendations: rows.map((row) => ({
      id: row.id,
      language: row.language,
      confidence: row.confidence,
      createdAt: row.createdAt,
      summary: row.parsedResponse?.summary,
      diseaseRisk: row.parsedResponse?.diseaseRisk,
    })),
  };
}

function toLatestDto(row, meta) {
  if (!row) {
    return { farmId: meta.farmId, recommendation: null };
  }
  return { farmId: meta.farmId, recommendation: toRecommendationDto(row) };
}

export const aiSchema = {
  toRecommendationDto,
  toHistoryDto,
  toLatestDto,
};
