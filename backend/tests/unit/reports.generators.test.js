import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { csvGenerator } from "../../src/integrations/reports/csvGenerator.js";
import { pdfGenerator } from "../../src/integrations/reports/pdfGenerator.js";
import { reportDataAggregator } from "../../src/integrations/reports/reportDataAggregator.js";

// These tests exercise the pure/deterministic building blocks of the
// reports module - the generators and the content-hash function - without
// touching the database, so they run with plain `node --test`, no test DB
// or server required.

const SAMPLE_SNAPSHOT = {
  farm: {
    id: "11111111-1111-1111-1111-111111111111",
    farmName: "Green Valley",
    crop: "Wheat",
    area: 5,
    areaUnit: "acres",
    latitude: 20.1,
    longitude: 75.2,
    village: "Sample Village",
    district: "Sample District",
    state: "Maharashtra",
    country: "India",
  },
  weather: {
    current: { temperature: 28.5, humidity: 60 },
    forecast: [
      { date: "2026-08-05", tempMax: 32, tempMin: 22, rainProbability: 10 },
      { date: "2026-08-06", tempMax: 33, tempMin: 23, rainProbability: 5 },
    ],
  },
  satellite: { ndvi: 0.62, sceneCount: 3 },
  aiRecommendation: {
    id: "22222222-2222-2222-2222-222222222222",
    confidence: 87.5,
    summary: "Crop health is good, monitor irrigation closely.",
    diseaseRisk: "low",
    irrigation: "Irrigate every 3 days",
    harvest: "Harvest window in 4-6 weeks",
  },
  sensorSnapshot: { soilMoisture: 34, soilPh: 6.7 },
  generatedAt: "2026-08-04T10:00:00.000Z",
};

const REPORT_META = { farmId: SAMPLE_SNAPSHOT.farm.id, reportType: "today", fileType: "pdf" };

describe("csvGenerator", () => {
  test("produces CSV text containing every major section", () => {
    const csv = csvGenerator.generate(SAMPLE_SNAPSHOT, REPORT_META);
    assert.match(csv, /Farm Details/i);
    assert.match(csv, /Current Weather/i);
    assert.match(csv, /Forecast/i);
    assert.match(csv, /AI Recommendation/i);
    assert.match(csv, /Satellite Summary/i);
    assert.match(csv, /Sensor Snapshot/i);
    assert.match(csv, /Green Valley/);
  });

  test("escapes values containing commas and quotes", () => {
    const snapshot = {
      ...SAMPLE_SNAPSHOT,
      aiRecommendation: {
        ...SAMPLE_SNAPSHOT.aiRecommendation,
        summary: 'Contains, a comma and a "quote"',
      },
    };
    const csv = csvGenerator.generate(snapshot, REPORT_META);
    assert.match(csv, /"Contains, a comma and a ""quote"""/);
  });

  test("renders 'Not available' when a section is missing", () => {
    const snapshot = { ...SAMPLE_SNAPSHOT, satellite: null, aiRecommendation: null };
    const csv = csvGenerator.generate(snapshot, REPORT_META);
    const notAvailableCount = (csv.match(/Not available/g) || []).length;
    assert.equal(notAvailableCount, 2);
  });
});

describe("pdfGenerator", () => {
  test("resolves a non-empty PDF buffer starting with the %PDF magic header", async () => {
    const buffer = await pdfGenerator.generate(SAMPLE_SNAPSHOT, REPORT_META);
    assert.ok(Buffer.isBuffer(buffer));
    assert.ok(buffer.length > 0);
    assert.equal(buffer.subarray(0, 4).toString("ascii"), "%PDF");
  });

  test("still produces a valid PDF when optional sections are missing", async () => {
    const snapshot = { ...SAMPLE_SNAPSHOT, satellite: null, aiRecommendation: null, sensorSnapshot: null };
    const buffer = await pdfGenerator.generate(snapshot, REPORT_META);
    assert.equal(buffer.subarray(0, 4).toString("ascii"), "%PDF");
  });
});

describe("reportDataAggregator.computeContentHash", () => {
  test("is deterministic for identical inputs", () => {
    const a = reportDataAggregator.computeContentHash({ ...REPORT_META, snapshot: SAMPLE_SNAPSHOT });
    const b = reportDataAggregator.computeContentHash({ ...REPORT_META, snapshot: SAMPLE_SNAPSHOT });
    assert.equal(a, b);
  });

  test("changes when weather data changes", () => {
    const a = reportDataAggregator.computeContentHash({ ...REPORT_META, snapshot: SAMPLE_SNAPSHOT });
    const changed = {
      ...SAMPLE_SNAPSHOT,
      weather: { ...SAMPLE_SNAPSHOT.weather, current: { temperature: 40, humidity: 20 } },
    };
    const b = reportDataAggregator.computeContentHash({ ...REPORT_META, snapshot: changed });
    assert.notEqual(a, b);
  });

  test("is unaffected by generatedAt alone", () => {
    const a = reportDataAggregator.computeContentHash({ ...REPORT_META, snapshot: SAMPLE_SNAPSHOT });
    const changed = { ...SAMPLE_SNAPSHOT, generatedAt: "2099-01-01T00:00:00.000Z" };
    const b = reportDataAggregator.computeContentHash({ ...REPORT_META, snapshot: changed });
    assert.equal(a, b);
  });

  test("changes when fileType changes", () => {
    const a = reportDataAggregator.computeContentHash({ ...REPORT_META, snapshot: SAMPLE_SNAPSHOT });
    const b = reportDataAggregator.computeContentHash({
      ...REPORT_META,
      fileType: "csv",
      snapshot: SAMPLE_SNAPSHOT,
    });
    assert.notEqual(a, b);
  });
});
