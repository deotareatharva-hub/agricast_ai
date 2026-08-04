import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { logger } from "./logger.js";

// Local-disk storage for generated report files. No cloud storage config
// exists anywhere in config/env.js today (S3/GCS credentials etc.), so
// this deliberately mirrors the project's existing local-disk convention
// (see utils/logger.js writing to backend/logs/) rather than introducing a
// new provider dependency. Swapping this for S3/GCS later only requires
// changing this one file - reports.service.js never touches the
// filesystem directly.

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const STORAGE_ROOT = path.resolve(__dirname, "../../storage/reports");

function ensureDir(dirPath) {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
}

// Every file lives under storage/reports/<farmId>/<reportId>.<ext> so a
// farm's reports are trivially browsable on disk and a farm delete could
// later cascade-clean its directory if desired.
function resolveReportPath(farmId, reportId, fileType) {
  const dir = path.join(STORAGE_ROOT, farmId);
  const relativePath = path.join("reports", farmId, `${reportId}.${fileType}`);
  return {
    absolutePath: path.join(dir, `${reportId}.${fileType}`),
    relativePath: relativePath.split(path.sep).join("/"), // stored as forward-slash regardless of OS
    dir,
  };
}

export const fileStorage = {
  // Writes `buffer` (or a UTF-8 string) to disk and returns the relative
  // path to persist in reports.download_url. Throws a plain Error on
  // failure - reports.service.js is responsible for translating that into
  // an ApiError.internal with a user-friendly message, same convention as
  // weather.service.js/satellite.service.js wrapping provider errors.
  save: async (farmId, reportId, fileType, content) => {
    const { absolutePath, relativePath, dir } = resolveReportPath(farmId, reportId, fileType);
    ensureDir(dir);
    await fs.promises.writeFile(absolutePath, content);
    logger.info("Report file written to storage", { farmId, reportId, fileType, relativePath });
    return relativePath;
  },

  // Resolves a stored relative path back to an absolute filesystem path
  // for streaming on download - never trusts a client-supplied path,
  // always derives it from the DB row's own relativePath.
  resolveAbsolutePath: (relativePath) => {
    const resolved = path.resolve(__dirname, "../../", relativePath);
    // Defense in depth: reject anything that resolves outside the storage
    // root (e.g. a corrupted/tampered relativePath), even though the path
    // always originates from our own fileStorage.save() output.
    if (!resolved.startsWith(STORAGE_ROOT)) {
      throw new Error("Resolved report path escapes storage root");
    }
    return resolved;
  },

  exists: (relativePath) => {
    try {
      const abs = fileStorage.resolveAbsolutePath(relativePath);
      return fs.existsSync(abs);
    } catch {
      return false;
    }
  },

  delete: async (relativePath) => {
    try {
      const abs = fileStorage.resolveAbsolutePath(relativePath);
      if (fs.existsSync(abs)) {
        await fs.promises.unlink(abs);
      }
    } catch (error) {
      logger.warn("Report file delete failed", { relativePath, message: error.message });
    }
  },
};
