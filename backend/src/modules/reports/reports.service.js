import crypto from "crypto";
import { ApiError } from "../../utils/ApiError.js";
import { logger } from "../../utils/logger.js";
import { farmRepository } from "../farms/farm.repository.js";
import { reportsRepository } from "./reports.repository.js";
import { reportDataAggregator } from "../../integrations/reports/reportDataAggregator.js";
import { pdfGenerator } from "../../integrations/reports/pdfGenerator.js";
import { csvGenerator } from "../../integrations/reports/csvGenerator.js";
import { fileStorage } from "../../utils/fileStorage.js";

// Business logic for the reports module. Controllers never touch the
// repository, aggregator, generators, or file storage directly - same
// convention as every other module's service. Every method takes the
// authenticated userId first so farm/report ownership is enforced here,
// in one place, before any file is generated, read, or deleted.

// Shared by every farm-scoped method: confirms the farm exists AND
// belongs to this user before we touch its data - reuses farmRepository
// (the farms module's own repository) so ownership stays a single source
// of truth, same as ai.service.js/weather.service.js/satellite.service.js.
async function getOwnedFarmOrThrow(userId, farmId) {
  const farm = await farmRepository.findByIdForUser(farmId, userId);
  if (!farm) {
    throw ApiError.notFound("Farm not found");
  }
  return farm;
}

async function getOwnedReportOrThrow(userId, reportId) {
  const report = await reportsRepository.findByIdForUser(reportId, userId);
  if (!report) {
    throw ApiError.notFound("Report not found");
  }
  return report;
}

function generateFileBuffer(fileType, snapshot, reportMeta) {
  if (fileType === "pdf") {
    return pdfGenerator.generate(snapshot, reportMeta);
  }
  if (fileType === "csv") {
    return Promise.resolve(Buffer.from(csvGenerator.generate(snapshot, reportMeta), "utf-8"));
  }
  if (fileType === "json") {
    return Promise.resolve(Buffer.from(JSON.stringify(snapshot, null, 2), "utf-8"));
  }
  // Unreachable given reports.validator.js's isIn(REPORT_FILE_TYPES) guard,
  // but kept as a defensive fallback rather than silently mis-generating.
  throw ApiError.badRequest(`Unsupported fileType: ${fileType}`);
}

export const reportsService = {
  generate: async (userId, { farmId, reportType, fileType, forceRegenerate }) => {
    const farm = await getOwnedFarmOrThrow(userId, farmId);

    // Gather every input the report needs BEFORE deciding whether to skip
    // regeneration - the content hash can only be computed from a fresh
    // snapshot, and weather/AI/satellite data may have changed since the
    // last report even if nothing else about the request did.
    let snapshot;
    try {
      snapshot = await reportDataAggregator.gather(userId, farm);
    } catch (error) {
      logger.error("Report data aggregation failed", {
        farmId,
        reportType,
        message: error.message,
      });
      throw error.isOperational
        ? error
        : ApiError.internal("Report data is temporarily unavailable. Please try again shortly.");
    }

    const contentHash = reportDataAggregator.computeContentHash({
      farmId,
      reportType,
      fileType,
      snapshot,
    });

    if (!forceRegenerate) {
      const existing = await reportsRepository.findLatestByContentHash(userId, {
        farmId,
        reportType,
        fileType,
        contentHash,
      });
      // Only reuse the existing row if its file is still actually present
      // on disk - a report row whose file was externally removed should
      // fall through to a fresh generation rather than pointing at a dead
      // download link.
      if (existing && existing.downloadUrl && fileStorage.exists(existing.downloadUrl)) {
        logger.info("Identical report already exists, skipping regeneration", {
          farmId,
          reportType,
          fileType,
          reportId: existing.id,
        });
        return { data: existing, reused: true };
      }
    }

    const reportMeta = { farmId, reportType, fileType, generatedAt: snapshot.generatedAt };

    let created;
    try {
      const fileBuffer = await generateFileBuffer(fileType, snapshot, reportMeta);

      // Insert first (without a final path) is unnecessary here since we
      // need the report id to name the file - generate the id via a
      // throwaway insert-then-update would be wasteful, so instead the
      // repository create() call happens once, after the file is already
      // on disk, using a pre-generated id for the filename.
      const reportId = crypto.randomUUID();
      const relativePath = await fileStorage.save(farmId, reportId, fileType, fileBuffer);

      created = await reportsRepository.create({
        id: reportId,
        farmId,
        generatedBy: userId,
        reportType,
        fileType,
        status: "completed",
        downloadUrl: relativePath,
        metadata: { ...snapshot, contentHash },
      });
    } catch (error) {
      logger.error("Report file generation failed", {
        farmId,
        reportType,
        fileType,
        message: error.message,
      });

      // Generation failure is recorded (not silently dropped) so the user
      // can see a failed attempt in their report history and retry - see
      // API error-handling requirement "Generation failure" / "Retry
      // strategy". The retry strategy itself is client-driven: the same
      // POST /generate request, since nothing server-side needs cleanup
      // beyond this audit row (no partial file was left behind, since
      // fileStorage.save only records success on a completed write).
      await reportsRepository
        .create({
          farmId,
          generatedBy: userId,
          reportType,
          fileType,
          status: "failed",
          downloadUrl: null,
          metadata: { ...snapshot, contentHash, error: error.message },
        })
        .catch((logError) =>
          logger.warn("Failed to record failed report attempt", { message: logError.message })
        );

      throw ApiError.internal(
        "Report generation failed. Please retry; if the problem persists, contact support."
      );
    }

    return { data: created, reused: false };
  },

  list: async (userId, { farmId, reportType, limit, offset }) => {
    if (farmId) {
      await getOwnedFarmOrThrow(userId, farmId);
    }
    const rows = await reportsRepository.findAllForUser(userId, {
      farmId,
      reportType,
      limit: limit || 20,
      offset: offset || 0,
    });
    return { data: rows, meta: { farmId: farmId || null } };
  },

  getById: async (userId, reportId) => {
    const report = await getOwnedReportOrThrow(userId, reportId);
    return { data: report };
  },

  // Resolves the report to an absolute file path for streaming - used by
  // reports.controller.js's download route. Ownership + existence are
  // both re-checked here rather than trusted from a prior call, since
  // download can be hit directly without going through getById first.
  getDownloadTarget: async (userId, reportId) => {
    const report = await getOwnedReportOrThrow(userId, reportId);
    if (report.status !== "completed" || !report.downloadUrl) {
      throw ApiError.badRequest("This report has no downloadable file.");
    }
    if (!fileStorage.exists(report.downloadUrl)) {
      throw ApiError.notFound("Report file is no longer available. Please regenerate it.");
    }
    return {
      absolutePath: fileStorage.resolveAbsolutePath(report.downloadUrl),
      fileType: report.fileType,
      reportType: report.reportType,
      reportId: report.id,
    };
  },

  delete: async (userId, reportId) => {
    const report = await getOwnedReportOrThrow(userId, reportId);
    if (report.downloadUrl) {
      await fileStorage.delete(report.downloadUrl);
    }
    await reportsRepository.deleteByIdForUser(reportId, userId);
    return { id: reportId };
  },
};
