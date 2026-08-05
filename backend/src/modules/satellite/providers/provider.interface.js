/**
 * SatelliteProvider Interface
 *
 * Every imagery provider must implement this interface. Controllers and services
 * never depend on a specific provider class - they call this interface. Adding a
 * new provider (Google Earth Engine, NASA EarthData, Planet Labs, Mapbox, etc.)
 * means creating a new class that satisfies these method signatures without
 * touching any controller or service.
 *
 * @interface SatelliteProvider
 */

/**
 * @typedef {Object} BoundingBox
 * @property {number} west  - Western longitude
 * @property {number} south - Southern latitude
 * @property {number} east  - Eastern longitude
 * @property {number} north - Northern latitude
 */

/**
 * @typedef {Object} DateRange
 * @property {string} from - ISO date string (YYYY-MM-DD)
 * @property {string} to   - ISO date string (YYYY-MM-DD)
 */

/**
 * @typedef {Object} ImageFetchParams
 * @property {BoundingBox} bbox
 * @property {DateRange}   dateRange
 * @property {string}      layer      - e.g. "NDVI", "TRUE_COLOR"
 * @property {number}      [width]    - Output image width in pixels
 * @property {number}      [height]   - Output image height in pixels
 */

/**
 * @typedef {Object} MetadataFetchParams
 * @property {BoundingBox} bbox
 * @property {DateRange}   dateRange
 * @property {number}      [limit]    - Max scenes to return
 */

/**
 * @typedef {Object} RawImageResult
 * @property {Buffer} imageBuffer
 * @property {string} contentType - MIME type (e.g. "image/png")
 */

/**
 * @typedef {Object} SceneMetadata
 * @property {string|null}  sceneId
 * @property {string|null}  capturedAt         - ISO 8601 datetime
 * @property {number|null}  cloudCoverPercent
 * @property {string|null}  [platform]         - Satellite platform name
 * @property {number|null}  [resolution]       - Ground sampling distance (metres)
 */

/**
 * @typedef {Object} RawMetadataResult
 * @property {SceneMetadata[]} scenes
 * @property {number}          totalCount
 */

/**
 * Base class representing the provider contract.
 * Concrete providers must extend this and override all methods.
 */
export class SatelliteProvider {
  /** @returns {string} Human-readable provider name, e.g. "Sentinel Hub" */
  get name() {
    throw new Error(`${this.constructor.name} must implement get name()`);
  }

  /** @returns {string[]} Supported layer IDs */
  get supportedLayers() {
    throw new Error(`${this.constructor.name} must implement get supportedLayers()`);
  }

  /**
   * Fetch a rendered satellite image for a given bbox, date range, and layer.
   * @param {ImageFetchParams} params
   * @returns {Promise<RawImageResult>}
   */
  async fetchImage(params) {
    throw new Error(`${this.constructor.name} must implement fetchImage()`);
  }

  /**
   * Fetch catalog/scene metadata (dates, cloud cover) without rendering an image.
   * @param {MetadataFetchParams} params
   * @returns {Promise<RawMetadataResult>}
   */
  async fetchMetadata(params) {
    throw new Error(`${this.constructor.name} must implement fetchMetadata()`);
  }

  /**
   * Optional: provider-specific health/readiness check.
   * @returns {Promise<boolean>}
   */
  async ping() {
    return true;
  }
}
