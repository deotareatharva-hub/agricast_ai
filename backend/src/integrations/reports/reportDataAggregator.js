import crypto from "crypto";
import { logger } from "../../utils/logger.js";
import { weatherService } from "../../modules/weather/weather.service.js";
import { satelliteService } from "../../modules/satellite/satellite.service.js";
import { aiService } from "../../modules/ai/ai.service.js";

// Pulls together every input a report is built from, WITHOUT touching any
// module's repository or Drizzle directly - only the public *.service.js
// exports of weather/satellite/ai are used, same layering rule
// ai.service.js itself follows for weather + satellite. This file is the
// Reports module's equivalent of ai.service.js's gatherWeatherSnapshot /
// gatherSatelliteSnapshot helpers, generalized to also include the latest
// AI recommendation and the sensor snapshot carried on it.
//
// A report never fails outright because ONE optional input is missing.
// Weather is the only input the report generation treats as mandatory
// (same rule the AI module applies), since every report type ("today",
// "weekly", "monthly", "recommendation") is meaningless without it.
// Satellite, AI recommendation, and sensor data degrade to null/absent
// with a logged warning - the PDF/CSV/JSON generators render an explicit
// "not available" section rather than guessing.

const SATELLITE_SUMMARY_LAYER = "NDVI"; // same choice ai.service.js makes for its snapshot

async function gatherFarmDetails(farm) {
  return {
    id: farm.id,
    farmName: farm.farmName,
    crop: farm.crop,
    area: farm.area,
    areaUnit: farm.areaUnit,
    latitude: farm.latitude,
    longitude: farm.longitude,
    village: farm.village,
    district: farm.district,
    state: farm.state,
    country: farm.country,
  };
}

async function gatherWeather(userId, farmId) {
  const [current, daily] = await Promise.all([
    weatherService.getCurrent(userId, farmId),
    weatherService.getDaily(userId, farmId),
  ]);
  return {
    current: current.data,
    forecast: daily.data,
  };
}

async function gatherSatelliteSummary(userId, farmId) {
  try {
    const { data } = await satelliteService.getMetadata(userId, farmId, {
      layer: SATELLITE_SUMMARY_LAYER,
    });
    return data;
  } catch (error) {
    logger.warn("Satellite summary unavailable for report, continuing without it", {
      farmId,
      message: error.message,
    });
    return null;
  }
}

// Fetched once and split into two report sections (AI recommendation +
// sensor snapshot) since both live on the same `recommendations` row -
// avoids two redundant round trips through aiService.getLatest.
async function gatherLatestRecommendationRow(userId, farmId) {
  try {
    const { data } = await aiService.getLatest(userId, farmId);
    return data || null;
  } catch (error) {
    logger.warn("AI recommendation unavailable for report, continuing without it", {
      farmId,
      message: error.message,
    });
    return null;
  }
}

function toAiRecommendationSection(row) {
  if (!row) return null;
  return {
    id: row.id,
    language: row.language,
    confidence: row.confidence,
    createdAt: row.createdAt,
    ...row.parsedResponse,
  };
}

// Deterministic hash of everything that affects report content, used by
// reports.service.js to detect "identical report already exists" without
// re-running PDF/CSV generation - see business rule "avoid regenerating
// identical reports unnecessarily". Excludes generatedAt/timestamps so two
// requests made seconds apart with unchanged underlying data still hash
// the same.
function computeContentHash({ farmId, reportType, fileType, snapshot }) {
  const stable = {
    farmId,
    reportType,
    fileType,
    farm: snapshot.farm,
    weather: snapshot.weather,
    satellite: snapshot.satellite,
    aiRecommendation: snapshot.aiRecommendation
      ? {
          id: snapshot.aiRecommendation.id,
          confidence: snapshot.aiRecommendation.confidence,
        }
      : null,
    sensorSnapshot: snapshot.sensorSnapshot,
  };
  return crypto.createHash("sha256").update(JSON.stringify(stable)).digest("hex");
}

export const reportDataAggregator = {
  // farm is the already-ownership-checked farm row from farmRepository
  // (reports.service.js fetches it before calling in, same pattern as
  // ai.service.js's getOwnedFarmOrThrow).
  gather: async (userId, farm) => {
    const farmId = farm.id;

    let weather;
    try {
      weather = await gatherWeather(userId, farmId);
    } catch (error) {
      logger.error("Weather data fetch failed for report generation", {
        farmId,
        message: error.message,
      });
      throw error;
    }

    const [satellite, latestRecommendationRow] = await Promise.all([
      gatherSatelliteSummary(userId, farmId),
      gatherLatestRecommendationRow(userId, farmId),
    ]);

    const snapshot = {
      farm: await gatherFarmDetails(farm),
      weather,
      satellite,
      aiRecommendation: toAiRecommendationSection(latestRecommendationRow),
      sensorSnapshot: latestRecommendationRow?.sensorSnapshot ?? null,
      generatedAt: new Date().toISOString(),
    };

    return snapshot;
  },

  computeContentHash,
};
