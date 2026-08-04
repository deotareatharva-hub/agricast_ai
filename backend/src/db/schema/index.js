// Barrel file - re-export every table so the rest of the app can do
// `import { users } from "../db/schema/index.js"` without knowing which
// file a given table lives in.
export * from "./users.schema.js";
export * from "./farms.schema.js";
export * from "./weather.schema.js";
export * from "./satellite.schema.js";
export * from "./recommendations.schema.js";
export * from "./reports.schema.js";
export * from "./analytics.schema.js";
