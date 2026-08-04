import { ApiError } from "../../utils/ApiError.js";
import { logger } from "../../utils/logger.js";

// Converts the raw string returned by grok.js into a plain JS object.
// This is deliberately the ONLY place that calls JSON.parse on AI output -
// recommendationValidator.js then checks the shape of what comes out of
// here. Kept separate from the validator so "is this even JSON" and "does
// this JSON have the fields we need" stay independently testable.

// Grok is instructed (see promptBuilder.js) to return raw JSON with no
// code fences, but models occasionally wrap output in ```json ... ```
// anyway - stripping defensively costs nothing and avoids a false-negative
// "malformed response" rejection for an otherwise-valid payload.
function stripCodeFences(text) {
  const trimmed = text.trim();
  const fenced = trimmed.match(/^```(?:json)?\s*([\s\S]*?)\s*```$/i);
  return fenced ? fenced[1] : trimmed;
}

export const responseParser = {
  // Throws ApiError (never returns undefined/null) so callers can treat a
  // successful return as guaranteed-parseable JSON.
  parse(rawText) {
    const candidate = stripCodeFences(rawText);

    let parsed;
    try {
      parsed = JSON.parse(candidate);
    } catch (error) {
      logger.error("Grok response was not valid JSON", { message: error.message });
      throw ApiError.internal(
        "The AI recommendation service returned a malformed response. Please try again."
      );
    }

    if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) {
      throw ApiError.internal(
        "The AI recommendation service returned an unexpected response shape."
      );
    }

    return parsed;
  },
};
