import { ApiError } from "../../utils/ApiError.js";

// Enforces the recommendation contract on top of responseParser.js's "is
// this valid JSON" check. responseParser.js guarantees an object;
// recommendationValidator.js guarantees that object has every field
// ai.repository.js and the frontend depend on: irrigation, harvest,
// diseaseRisk, summary, and confidence. Kept as its own file (per the
// spec) rather than folded into responseParser.js so the "shape of valid
// JSON" and "shape of a valid recommendation" concerns stay separable -
// e.g. a future non-Grok provider could reuse this validator with a
// different parser in front of it.

const VALID_DISEASE_LEVELS = ["Low", "Medium", "High"];

function isNonEmptyString(value) {
  return typeof value === "string" && value.trim().length > 0;
}

function isConfidenceScore(value) {
  return typeof value === "number" && Number.isFinite(value) && value >= 0 && value <= 100;
}

function fail(reason) {
  throw ApiError.internal(
    `The AI recommendation response failed validation: ${reason}`
  );
}

export const recommendationValidator = {
  // Throws on the first missing/invalid field so failures are specific and
  // debuggable from the logs, rather than a single generic "invalid
  // response" message.
  validate(parsed) {
    if (!isNonEmptyString(parsed.summary)) {
      fail("missing or empty 'summary'");
    }

    if (!parsed.irrigation || typeof parsed.irrigation !== "object") {
      fail("missing 'irrigation' object");
    }
    if (!isNonEmptyString(parsed.irrigation.action)) {
      fail("missing 'irrigation.action'");
    }
    if (!isNonEmptyString(parsed.irrigation.reason)) {
      fail("missing 'irrigation.reason'");
    }

    if (!parsed.harvest || typeof parsed.harvest !== "object") {
      fail("missing 'harvest' object");
    }
    if (!isNonEmptyString(parsed.harvest.action)) {
      fail("missing 'harvest.action'");
    }
    if (!isNonEmptyString(parsed.harvest.reason)) {
      fail("missing 'harvest.reason'");
    }

    if (!parsed.diseaseRisk || typeof parsed.diseaseRisk !== "object") {
      fail("missing 'diseaseRisk' object");
    }
    if (!VALID_DISEASE_LEVELS.includes(parsed.diseaseRisk.level)) {
      fail(`'diseaseRisk.level' must be one of ${VALID_DISEASE_LEVELS.join(", ")}`);
    }
    if (!isNonEmptyString(parsed.diseaseRisk.reason)) {
      fail("missing 'diseaseRisk.reason'");
    }

    if (!isConfidenceScore(parsed.confidence)) {
      fail("missing or out-of-range top-level 'confidence' (must be 0-100)");
    }

    // Non-critical fields: normalized with safe defaults rather than
    // rejected outright, since their absence doesn't undermine the
    // recommendation itself.
    if (!Array.isArray(parsed.alerts)) {
      parsed.alerts = [];
    }
    if (!isNonEmptyString(parsed.nextReview)) {
      parsed.nextReview = null;
    }

    return parsed;
  },
};
