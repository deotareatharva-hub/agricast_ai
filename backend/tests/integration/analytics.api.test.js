import { test, describe, before, after } from "node:test";
import assert from "node:assert/strict";
import bcrypt from "bcrypt";
import { app } from "../../src/app.js";
import { pool, db } from "../../src/config/db.js";
import { env } from "../../src/config/env.js";
import { jwtUtil } from "../../src/utils/jwt.util.js";
import { users, farms, weatherHistory, recommendations } from "../../src/db/schema/index.js";
import { eq } from "drizzle-orm";

// End-to-end tests against the real Express app + a real Postgres
// database (migrations from src/db/migrations must already be applied -
// see AnalyticsGuide.md "Testing"). Uses Node's built-in test runner and
// fetch client, matching the project's zero-extra-test-framework
// footprint - same pattern as tests/integration/reports.api.test.js.
//
// Run with: npm test
// Requires: DATABASE_URL pointed at a disposable test database.

let server;
let baseUrl;
let token;
let userId;
let farmId;
let emptyFarmId; // farm with no weather/recommendation history at all

async function api(pathSuffix, options = {}) {
  const res = await fetch(`${baseUrl}${env.apiPrefix}${pathSuffix}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      ...(options.headers || {}),
    },
  });
  const body = await res.json().catch(() => null);
  return { status: res.status, body };
}

describe("Analytics API (integration)", () => {
  before(async () => {
    server = app.listen(0);
    const { port } = server.address();
    baseUrl = `http://127.0.0.1:${port}`;

    const passwordHash = await bcrypt.hash("Test@12345", 4);
    const [user] = await db
      .insert(users)
      .values({
        fullName: "Analytics Test User",
        email: `analytics-test-${Date.now()}@example.com`,
        passwordHash,
      })
      .returning();
    userId = user.id;
    token = jwtUtil.sign({ sub: user.id, email: user.email });

    const [farm] = await db
      .insert(farms)
      .values({
        userId,
        farmName: "Analytics Test Farm",
        crop: "Wheat",
        area: 4,
        areaUnit: "acres",
        latitude: 20.1,
        longitude: 75.2,
        village: "Test Village",
        district: "Test District",
        state: "Maharashtra",
        country: "India",
      })
      .returning();
    farmId = farm.id;

    const [emptyFarm] = await db
      .insert(farms)
      .values({
        userId,
        farmName: "Empty Analytics Farm",
        crop: "Rice",
        area: 2,
        areaUnit: "acres",
        latitude: 21.0,
        longitude: 76.0,
        village: "V",
        district: "D",
        state: "Maharashtra",
        country: "India",
      })
      .returning();
    emptyFarmId = emptyFarm.id;

    // 10 days of weather history for the main farm.
    const now = Date.now();
    const rows = Array.from({ length: 10 }, (_, i) => ({
      farmId,
      recordedAt: new Date(now - i * 24 * 60 * 60 * 1000),
      temperature: 26 + i,
      humidity: 55 + i,
      windSpeed: 4 + i,
      rainProbability: i * 5,
      weatherCode: i % 2 === 0 ? 0 : 61,
    }));
    await db.insert(weatherHistory).values(rows);

    await db.insert(recommendations).values([
      {
        farmId,
        weatherSnapshot: { temperature: 28 },
        prompt: "test",
        rawResponse: "test",
        parsedResponse: { summary: "Irrigate soon" },
        language: "en",
        confidence: 85,
      },
      {
        farmId,
        weatherSnapshot: { temperature: 27 },
        prompt: "test",
        rawResponse: "test",
        parsedResponse: { summary: "Monitor for pests" },
        language: "hi",
        confidence: 78,
      },
    ]);
  });

  after(async () => {
    if (userId) {
      await db.delete(users).where(eq(users.id, userId)).catch(() => {});
    }
    await new Promise((resolve) => server?.close(resolve));
    await pool.end();
  });

  test("rejects unauthenticated requests", async () => {
    const res = await fetch(`${baseUrl}${env.apiPrefix}/analytics/dashboard/${farmId}`);
    assert.equal(res.status, 401);
  });

  test("rejects an invalid farmId", async () => {
    const { status, body } = await api("/analytics/dashboard/not-a-uuid");
    assert.equal(status, 400);
    assert.equal(body.success, false);
  });

  test("returns 404 for a farm the user doesn't own", async () => {
    const { status } = await api(
      "/analytics/dashboard/00000000-0000-4000-8000-000000000000"
    );
    assert.equal(status, 404);
  });

  test("GET /analytics/dashboard/:farmId returns aggregated data", async () => {
    const { status, body } = await api(`/analytics/dashboard/${farmId}`);
    assert.equal(status, 200);
    assert.equal(body.data.farm.farmId, farmId);
    assert.equal(body.data.weather.summary.recordCount, 10);
    assert.equal(body.data.recentRecommendations.length, 2);
    assert.equal(body.data.cached, false);
  });

  test("GET /analytics/dashboard/:farmId is cached on the second call", async () => {
    const { body } = await api(`/analytics/dashboard/${farmId}`);
    assert.equal(body.data.cached, true);
  });

  test("GET /analytics/weather/:farmId returns trends and distribution", async () => {
    const { status, body } = await api(`/analytics/weather/${farmId}?granularity=day`);
    assert.equal(status, 200);
    assert.ok(Array.isArray(body.data.trends));
    assert.ok(body.data.trends.length > 0);
    assert.ok(Array.isArray(body.data.distribution));
  });

  test("GET /analytics/weather/:farmId rejects an invalid granularity", async () => {
    const { status, body } = await api(`/analytics/weather/${farmId}?granularity=fortnight`);
    assert.equal(status, 400);
    assert.equal(body.success, false);
  });

  test("GET /analytics/recommendations/:farmId returns history and confidence stats", async () => {
    const { status, body } = await api(`/analytics/recommendations/${farmId}`);
    assert.equal(status, 200);
    assert.equal(body.data.summary.totalCount, 2);
    assert.equal(body.data.history.length, 2);
  });

  test("GET /analytics/monthly/:farmId rejects a bad month format", async () => {
    const { status } = await api(`/analytics/monthly/${farmId}?month=2026-13`);
    assert.equal(status, 400);
  });

  test("GET /analytics/monthly/:farmId returns a monthly summary", async () => {
    const { status, body } = await api(`/analytics/monthly/${farmId}`);
    assert.equal(status, 200);
    assert.ok(body.data.month);
    assert.ok(body.data.weather);
  });

  test("GET /analytics/weekly/:farmId returns a weekly summary", async () => {
    const { status, body } = await api(`/analytics/weekly/${farmId}`);
    assert.equal(status, 200);
    assert.ok(body.data.week);
  });

  test("GET /analytics/summary/:farmId returns a daily summary", async () => {
    const { status, body } = await api(`/analytics/summary/${farmId}`);
    assert.equal(status, 200);
    assert.ok(body.data.date);
    assert.ok(body.data.farm);
  });

  test("a farm with no history returns empty (not an error)", async () => {
    const { status, body } = await api(`/analytics/dashboard/${emptyFarmId}`);
    assert.equal(status, 200);
    assert.equal(body.data.weather.summary.recordCount, 0);
    assert.equal(body.data.weather.summary.temperature.avg, null);
    assert.deepEqual(body.data.weather.trends, []);
    assert.deepEqual(body.data.recentRecommendations, []);
  });

  test("a second user cannot read the first user's farm analytics", async () => {
    const passwordHash = await bcrypt.hash("Test@12345", 4);
    const [otherUser] = await db
      .insert(users)
      .values({
        fullName: "Other Analytics User",
        email: `analytics-other-${Date.now()}@example.com`,
        passwordHash,
      })
      .returning();
    const otherToken = jwtUtil.sign({ sub: otherUser.id, email: otherUser.email });

    const res = await fetch(`${baseUrl}${env.apiPrefix}/analytics/dashboard/${farmId}`, {
      headers: { Authorization: `Bearer ${otherToken}` },
    });
    assert.equal(res.status, 404);

    await db.delete(users).where(eq(users.id, otherUser.id));
  });
});
