// Builds the three-part prompt (system / developer / user) sent to Grok.
// Kept separate from grok.js so prompt engineering can evolve independently
// of the HTTP client, and separate from ai.service.js so the orchestration
// logic (fetch data, call Grok, parse, store) doesn't get tangled up with
// prompt copy. Every function here is pure - no I/O, no DB, no network -
// so prompt changes are trivial to unit test.

const LANGUAGE_NAMES = {
  en: "English",
  hi: "Hindi (हिन्दी)",
  mr: "Marathi (मराठी)",
};

const STRICT_JSON_SHAPE = `{
  "summary": string,
  "irrigation": { "action": string, "reason": string, "confidence": number (0-100) },
  "harvest": { "action": string, "reason": string },
  "diseaseRisk": { "level": "Low" | "Medium" | "High", "reason": string },
  "confidence": number (0-100),
  "alerts": string[],
  "nextReview": string (ISO 8601 date)
}`;

// System prompt: fixed persona + non-negotiable output contract. Does not
// change per-request, so it's the cheapest part of the prompt to cache on
// the provider side if Grok ever adds prompt caching.
function buildSystemPrompt() {
  return [
    "You are the AgriCast AI decision engine, an expert agronomist assistant",
    "for smallholder and mid-size farms. You analyze weather, satellite,",
    "and sensor data to produce precise, actionable, farmer-facing guidance.",
    "You are cautious: you never recommend an action you are not reasonably",
    "confident in, and you always surface risk clearly rather than",
    "downplaying it.",
  ].join(" ");
}

// Developer prompt: the strict output contract. Kept separate from the
// system prompt so the "who you are" framing and the "what shape your
// answer must take" rules can be revised independently.
function buildDeveloperPrompt(language) {
  const languageName = LANGUAGE_NAMES[language] || LANGUAGE_NAMES.en;
  return [
    "Respond with STRICT JSON ONLY - no markdown code fences, no preamble,",
    "no explanation outside the JSON object. The response MUST be valid",
    "JSON matching exactly this shape:",
    "",
    STRICT_JSON_SHAPE,
    "",
    `Write every free-text value (summary, reason fields, alerts, action) in ${languageName}.`,
    "Keep all JSON keys in English exactly as shown above, regardless of language.",
    'The "diseaseRisk.level" value must always be one of exactly "Low", "Medium", or "High" (English, not translated) so it can be machine-read.',
    'confidence values are integers from 0 to 100. "alerts" is an array of short strings and may be empty.',
    "If a required data source is missing (e.g. no satellite snapshot), reason around its absence rather than inventing values for it.",
  ].join("\n");
}

// User prompt: the actual per-request data. Formatted as labeled sections
// rather than raw JSON dumped into the prompt - measurably improves output
// quality for report-generation-style tasks like this one, and keeps the
// prompt readable for anyone debugging a stored `prompt` column later.
function buildUserPrompt({ farm, crop, weather, satellite, sensor }) {
  const sections = [];

  sections.push(
    `FARM\nName: ${farm.farmName}\nCrop: ${crop}\nArea: ${farm.area} ${farm.areaUnit}\nLocation: ${farm.village}, ${farm.district}, ${farm.state}, ${farm.country}\nCoordinates: ${farm.latitude}, ${farm.longitude}`
  );

  sections.push(`WEATHER\n${JSON.stringify(weather ?? {}, null, 2)}`);

  sections.push(
    `SATELLITE\n${satellite ? JSON.stringify(satellite, null, 2) : "Not available for this request."}`
  );

  sections.push(
    `SENSOR\n${sensor ? JSON.stringify(sensor, null, 2) : "No on-ground sensor data supplied for this request."}`
  );

  sections.push(
    "TASK\nUsing the data above, produce irrigation guidance, a harvest recommendation, a disease risk assessment, an overall confidence score, any alerts the farmer should know about, and a next-review date."
  );

  return sections.join("\n\n");
}

export const promptBuilder = {
  // Returns { systemPrompt, developerPrompt, userPrompt, combined } - the
  // first three are what grok.js sends as separate messages;`combined` is
  // a single string used only for the `prompt` column persisted to
  // recommendations (see ai.repository.js) so the full context of any past
  // recommendation is readable in one place without reassembling parts.
  build({ farm, crop, weather, satellite, sensor, language }) {
    const systemPrompt = buildSystemPrompt();
    const developerPrompt = buildDeveloperPrompt(language);
    const userPrompt = buildUserPrompt({ farm, crop, weather, satellite, sensor });

    const combined = [
      "=== SYSTEM ===",
      systemPrompt,
      "",
      "=== DEVELOPER ===",
      developerPrompt,
      "",
      "=== USER ===",
      userPrompt,
    ].join("\n");

    return { systemPrompt, developerPrompt, userPrompt, combined };
  },
};
