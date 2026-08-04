import { ApiError } from "../../utils/ApiError.js";
import { logger } from "../../utils/logger.js";
import { farmRepository } from "../farms/farm.repository.js";
import { weatherService } from "../weather/weather.service.js";
import { satelliteService } from "../satellite/satellite.service.js";
import { aiRepository } from "./ai.repository.js";
import { promptBuilder } from "../../integrations/ai/promptBuilder.js";
import { grokClient } from "../../integrations/ai/grok.js";
import { responseParser } from "../../integrations/ai/responseParser.js";
import { recommendationValidator } from "../../integrations/ai/recommendationValidator.js";

// Business logic for the AI Recommendation module. Controllers never touch
// the repository, Grok client, prompt builder, or parser/validator
// directly - same convention as every other module's service. Every
// method takes the authenticated userId first so farm ownership is
// enforced here, in one place, before any AI call is made or any snapshot
// data is gathered.

const DEFAULT_HISTORY_LIMIT = 20;
const SATELLITE_SNAPSHOT_LAYER = "NDVI"; // vegetation health index - most relevant input for crop recommendations

// Shared by every farm-scoped method: confirms the farm exists AND belongs
// to this user before we touch its data. Reuses farmRepository (the farms
// module's own repository) so ownership stays a single source of truth,
// same as weather.service.js and satellite.service.js do.
async function getOwnedFarmOrThrow(userId, farmId) {
  const farm = await farmRepository.findByIdForUser(farmId, userId);
  if (!farm) {
    throw ApiError.notFound("Farm not found");
  }
  return farm;
}

// Weather is a required input to the decision engine (weather_snapshot is
// NOT NULL - see db/schema/recommendations.schema.js), so a fetch failure
// here is fatal to the recommendation request rather than degraded
// gracefully. Reuses weatherService (not the repository directly) so the
// existing cache-first behavior is inherited for free - this also
// satisfies the "reuse weather snapshots, limit unnecessary calls"
// performance requirement without any weather-module changes.
async function gatherWeatherSnapshot(userId, farmId) {
  const [current, daily] = await Promise.all([
    weatherService.getCurrent(userId, farmId),
    weatherService.getDaily(userId, farmId),
  ]);
  return { current: current.data, daily: daily.data };
}

// Satellite is an optional input (satellite_snapshot is nullable) since
// Sentinel Hub credentials are themselves optional for the whole app (see
// config/env.js). A failure here (missing credentials, Sentinel Hub
// outage) is logged and degrades to "no satellite data" rather than
// failing the whole recommendation - the AI is explicitly instructed (see
// promptBuilder.js) to reason around a missing satellite section rather
// than invent values for it.
async function gatherSatelliteSnapshot(userId, farmId) {
  try {
    const { data } = await satelliteService.getMetadata(userId, farmId, {
      layer: SATELLITE_SNAPSHOT_LAYER,
    });
    return data;
  } catch (error) {
    logger.warn("Satellite snapshot unavailable for AI recommendation, continuing without it", {
      farmId,
      message: error.message,
    });
    return null;
  }
}

export const aiService = {
  recommend: async (userId, { farmId, sensorSnapshot, language }) => {
    const farm = await getOwnedFarmOrThrow(userId, farmId);
    const resolvedLanguage = language || "en";

    let weatherSnapshot;
    try {
      weatherSnapshot = await gatherWeatherSnapshot(userId, farmId);
    } catch (error) {
      logger.error("Weather snapshot fetch failed for AI recommendation", {
        farmId,
        message: error.message,
      });
      throw error.isOperational
        ? error
        : ApiError.internal("Weather data is temporarily unavailable for this recommendation.");
    }

    const satelliteSnapshot = await gatherSatelliteSnapshot(userId, farmId);

    const { systemPrompt, developerPrompt, userPrompt, combined } = promptBuilder.build({
      farm,
      crop: farm.crop,
      weather: weatherSnapshot,
      satellite: satelliteSnapshot,
      sensor: sensorSnapshot || null,
      language: resolvedLanguage,
    });

    const rawResponse = await grokClient.generateCompletion({
      systemPrompt,
      developerPrompt,
      userPrompt,
    });

    const parsed = responseParser.parse(rawResponse);
    const validated = recommendationValidator.validate(parsed);

    const saved = await aiRepository.create({
      farmId: farm.id,
      weatherSnapshot,
      satelliteSnapshot,
      sensorSnapshot: sensorSnapshot || null,
      prompt: combined,
      rawResponse,
      parsedResponse: validated,
      language: resolvedLanguage,
      confidence: validated.confidence,
    });

    return { data: saved };
  },

  getHistory: async (userId, farmId, { limit, offset }) => {
    await getOwnedFarmOrThrow(userId, farmId);
    const rows = await aiRepository.findHistory(farmId, {
      limit: limit || DEFAULT_HISTORY_LIMIT,
      offset: offset || 0,
    });
    return { data: rows, meta: { farmId } };
  },

  getLatest: async (userId, farmId) => {
    await getOwnedFarmOrThrow(userId, farmId);
    const row = await aiRepository.findLatest(farmId);
    return { data: row, meta: { farmId } };
  },
};
