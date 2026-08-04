// Translates Sentinel Hub's raw response shapes into the normalized
// internal shape the rest of the app works with. This isolates every
// other module from Sentinel Hub's specific field names (e.g.
// `eo:cloud_cover`, STAC `features[]`) - if Sentinel Hub's API changes or
// a second imagery provider is added later, only this file changes. Same
// role as integrations/weather/weatherMapper.js.

const LAYER_LABELS = {
  TRUE_COLOR: "True Color",
  FALSE_COLOR: "False Color (Vegetation Highlight)",
  NDVI: "NDVI (Vegetation Index)",
  MOISTURE_INDEX: "Moisture Index",
  EVI: "Enhanced Vegetation Index",
};

const LAYER_DESCRIPTIONS = {
  TRUE_COLOR: "Natural-color image, as the human eye would see the field.",
  FALSE_COLOR: "Near-infrared composite that makes healthy vegetation stand out in red.",
  NDVI: "Single-band vegetation health/density index, typically -1 to 1.",
  MOISTURE_INDEX: "Single-band canopy/soil moisture proxy, typically -1 to 1.",
  EVI: "Vegetation index tuned for dense canopy, corrects for soil/atmosphere noise.",
};

export const sentinelMapper = {
  // Raw Process API response (binary image + content-type) -> DTO with a
  // base64-encoded image the frontend can render directly.
  mapImage: (raw, { layer, bbox, dateRange }) => {
    const buffer = Buffer.isBuffer(raw.imageBuffer)
      ? raw.imageBuffer
      : Buffer.from(raw.imageBuffer);

    return {
      layer,
      bbox,
      dateRange,
      mimeType: raw.contentType,
      imageBase64: buffer.toString("base64"),
      sizeBytes: buffer.length,
    };
  },

  // Raw Catalog API (STAC) search response -> flat list of scenes, newest
  // first, with only the fields the frontend actually needs.
  mapMetadata: (raw, { layer, bbox, dateRange }) => {
    const features = Array.isArray(raw?.features) ? raw.features : [];

    const scenes = features
      .map((feature) => ({
        sceneId: feature.id ?? null,
        capturedAt: feature.properties?.datetime ?? null,
        cloudCoverPercent: feature.properties?.["eo:cloud_cover"] ?? null,
      }))
      .sort((a, b) => new Date(b.capturedAt) - new Date(a.capturedAt));

    return {
      layer,
      bbox,
      dateRange,
      sceneCount: scenes.length,
      scenes,
    };
  },

  // Static supported-layer list -> frontend-friendly {id, label,
  // description} entries. No Sentinel Hub call involved - this just
  // documents what evalscripts sentinel.js currently supports.
  mapLayers: (supportedLayers) =>
    supportedLayers.map((layer) => ({
      id: layer,
      label: LAYER_LABELS[layer] || layer,
      description: LAYER_DESCRIPTIONS[layer] || "",
    })),
};
