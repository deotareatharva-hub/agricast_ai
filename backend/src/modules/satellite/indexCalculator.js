/**
 * indexCalculator.js
 *
 * Pure functions for computing spectral indices and derived scores from
 * satellite scene metadata. Nothing here touches the database, Express,
 * or any external API - it only operates on plain numbers and objects.
 *
 * Currently implemented:
 *   NDVI  - Normalized Difference Vegetation Index
 *   NDWI  - Normalized Difference Water Index
 *   EVI   - Enhanced Vegetation Index (simplified)
 *   Vegetation Health Score (0-100)
 *   Moisture classification
 *   Crop Health Assessment
 */

import { clampIndex, classifyNdvi } from "./imageProcessor.js";

// ---------------------------------------------------------------------------
// Band-level index calculations
// ---------------------------------------------------------------------------

/**
 * NDVI = (NIR - Red) / (NIR + Red)
 * Range: [-1, 1]. Values > 0.3 typically indicate healthy vegetation.
 *
 * @param {number} nir  - Near-infrared reflectance
 * @param {number} red  - Red reflectance
 * @returns {number}
 */
export function computeNdvi(nir, red) {
  const denom = nir + red;
  if (denom === 0) return 0;
  return clampIndex((nir - red) / denom);
}

/**
 * NDWI = (Green - NIR) / (Green + NIR)
 * Range: [-1, 1]. Positive values indicate open water; negative = land.
 *
 * @param {number} green - Green reflectance
 * @param {number} nir   - Near-infrared reflectance
 * @returns {number}
 */
export function computeNdwi(green, nir) {
  const denom = green + nir;
  if (denom === 0) return 0;
  return clampIndex((green - nir) / denom);
}

/**
 * EVI (simplified) = 2.5 * (NIR - Red) / (NIR + 6*Red - 7.5*Blue + 1)
 * Better than NDVI in dense canopy areas.
 *
 * @param {number} nir
 * @param {number} red
 * @param {number} blue
 * @returns {number}
 */
export function computeEvi(nir, red, blue) {
  const denom = nir + 6 * red - 7.5 * blue + 1;
  if (denom === 0) return 0;
  return clampIndex(2.5 * ((nir - red) / denom));
}

// ---------------------------------------------------------------------------
// Health Score (0–100)
// ---------------------------------------------------------------------------

/**
 * Compute a 0–100 Vegetation Health Score from available scene metadata.
 *
 * The score combines:
 *   - Scene availability  (40 pts max): more available scenes = more data confidence
 *   - Cloud cover penalty (40 pts max): lower cloud = better image quality
 *   - NDVI contribution   (20 pts max): if an approximate NDVI is available
 *
 * This is an approximation derived from metadata (not from raw band values)
 * and is intended for dashboard display, not scientific analysis.
 *
 * @param {{ sceneCount: number, scenes: Array<{ cloudCoverPercent: number|null }>, ndvi?: number|null }} params
 * @returns {{ score: number, grade: string, description: string }}
 */
export function computeHealthScore({ sceneCount, scenes, ndvi = null }) {
  // --- scene availability sub-score (0–40) --------------------------------
  const availScore = Math.min(sceneCount / 5, 1) * 40;

  // --- cloud cover sub-score (0–40) ----------------------------------------
  let cloudScore = 20; // default when no scenes
  if (scenes && scenes.length > 0) {
    const validScenes = scenes.filter((s) => s.cloudCoverPercent != null);
    if (validScenes.length > 0) {
      const avgCloud =
        validScenes.reduce((sum, s) => sum + s.cloudCoverPercent, 0) / validScenes.length;
      // 0% cloud → 40 pts; 100% cloud → 0 pts
      cloudScore = Math.max(0, ((100 - avgCloud) / 100) * 40);
    }
  }

  // --- NDVI sub-score (0–20) -----------------------------------------------
  let ndviScore = 10; // neutral when unavailable
  if (ndvi != null) {
    // NDVI of 0.8+ → 20 pts; NDVI of 0 → 0 pts; negative → 0 pts
    ndviScore = Math.max(0, Math.min(ndvi, 0.8) / 0.8) * 20;
  }

  const rawScore = availScore + cloudScore + ndviScore;
  const score = Math.round(Math.min(100, Math.max(0, rawScore)));

  const { grade, description } = gradeHealthScore(score);
  return { score, grade, description };
}

/**
 * Convert a 0–100 health score to a letter grade and human-readable label.
 * @param {number} score
 * @returns {{ grade: string, description: string }}
 */
export function gradeHealthScore(score) {
  if (score >= 85) return { grade: "A", description: "Excellent" };
  if (score >= 70) return { grade: "B", description: "Good" };
  if (score >= 55) return { grade: "C", description: "Moderate" };
  if (score >= 40) return { grade: "D", description: "Poor" };
  return { grade: "F", description: "Critical" };
}

// ---------------------------------------------------------------------------
// Moisture classification
// ---------------------------------------------------------------------------

/**
 * Classify a NDWI value into a soil/canopy moisture level.
 * @param {number|null} ndwi
 * @returns {{ label: string, level: 'dry'|'low'|'moderate'|'high'|'water'|'unknown' }}
 */
export function classifyMoisture(ndwi) {
  if (ndwi == null) return { label: "Unknown", level: "unknown" };
  if (ndwi < -0.3)  return { label: "Very Dry", level: "dry" };
  if (ndwi < 0)     return { label: "Low Moisture", level: "low" };
  if (ndwi < 0.1)   return { label: "Moderate Moisture", level: "moderate" };
  if (ndwi < 0.3)   return { label: "High Moisture", level: "high" };
  return { label: "Water Body", level: "water" };
}

// ---------------------------------------------------------------------------
// Crop Health Assessment
// ---------------------------------------------------------------------------

/**
 * Produce a plain-text crop health assessment from available indices.
 *
 * @param {{ ndvi?: number|null, ndwi?: number|null, cloudCoverPercent?: number|null }} params
 * @returns {{ summary: string, recommendations: string[] }}
 */
export function assessCropHealth({ ndvi = null, ndwi = null, cloudCoverPercent = null }) {
  const ndviClass = classifyNdvi(ndvi);
  const moistureClass = classifyMoisture(ndwi);
  const recommendations = [];

  if (cloudCoverPercent != null && cloudCoverPercent > 70) {
    recommendations.push(
      "High cloud cover reduces image quality. Wait for a clearer day to get more accurate readings."
    );
  }

  if (ndvi != null) {
    if (ndvi < 0.2) {
      recommendations.push("Very low vegetation index detected. Check if the field is bare, stressed, or recently harvested.");
    } else if (ndvi < 0.4) {
      recommendations.push("Sparse vegetation detected. Consider irrigation, fertilization, or pest inspection.");
    } else if (ndvi > 0.7) {
      recommendations.push("Dense, healthy vegetation detected. Maintain current practices.");
    }
  }

  if (ndwi != null) {
    if (ndwi < -0.3) {
      recommendations.push("Very low moisture index. Irrigation may be required.");
    } else if (ndwi > 0.3) {
      recommendations.push("High water index detected. Check for waterlogging or drainage issues.");
    }
  }

  if (recommendations.length === 0) {
    recommendations.push("Conditions appear normal. Continue monitoring weekly.");
  }

  const summary = `Vegetation: ${ndviClass.label}. Moisture: ${moistureClass.label}.`;

  return { summary, recommendations };
}
