import { test, describe, before, after } from "node:test";
import assert from "node:assert/strict";
import bcrypt from "bcrypt";
import { app } from "../../src/app.js";
import { pool, db } from "../../src/config/db.js";
import { env } from "../../src/config/env.js";
import { jwtUtil } from "../../src/utils/jwt.util.js";
import { users, farms } from "../../src/db/schema/index.js";
import { eq } from "drizzle-orm";

// End-to-end tests against the real Express app + a real Postgres
// database (migrations from src/db/migrations must already be applied -
// see ReportsGuide.md "Testing" section for setup). Uses Node's built-in
// test runner and fetch client, matching the project's zero-extra-test-
// framework footprint (no jest/supertest dependency added).
//
// Run with: npm test
// Requires: DATABASE_URL pointed at a disposable test database.

let server;
let baseUrl;
let token;
let userId;
let farmId;
let createdReportId;

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

describe("Reports API (integration)", () => {
  before(async () => {
    server = app.listen(0);
    const { port } = server.address();
    baseUrl = `http://127.0.0.1:${port}`;

    // Seed a throwaway user + farm directly via Drizzle, bypassing the
    // HTTP auth/farm endpoints since this suite is scoped to Reports only.
    const passwordHash = await bcrypt.hash("Test@12345", 4);
    const [user] = await db
      .insert(users)
      .values({
        fullName: "Reports Test User",
        email: `reports-test-${Date.now()}@example.com`,
        passwordHash,
      })
      .returning();
    userId = user.id;
    token = jwtUtil.sign({ sub: user.id, email: user.email });

    const [farm] = await db
      .insert(farms)
      .values({
        userId,
        farmName: "Reports Test Farm",
        crop: "Wheat",
        area: 3,
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
  });

  after(async () => {
    // Best-effort cleanup - cascading deletes handle reports/farms once
    // the user row is removed.
    if (userId) {
      await db.delete(users).where(eq(users.id, userId)).catch(() => {});
    }
    await new Promise((resolve) => server?.close(resolve));
    await pool.end();
  });

  test("rejects unauthenticated requests", async () => {
    const res = await fetch(`${baseUrl}${env.apiPrefix}/reports`);
    assert.equal(res.status, 401);
  });

  test("POST /reports/generate rejects an unowned/nonexistent farm", async () => {
    const { status, body } = await api("/reports/generate", {
      method: "POST",
      body: JSON.stringify({
        farmId: "00000000-0000-0000-0000-000000000000",
        reportType: "today",
        fileType: "json",
      }),
    });
    assert.equal(status, 404);
    assert.equal(body.success, false);
  });

  test("POST /reports/generate rejects an invalid reportType", async () => {
    const { status, body } = await api("/reports/generate", {
      method: "POST",
      body: JSON.stringify({ farmId, reportType: "yearly", fileType: "json" }),
    });
    assert.equal(status, 400);
    assert.equal(body.success, false);
  });

  test("POST /reports/generate creates a JSON report", async () => {
    const { status, body } = await api("/reports/generate", {
      method: "POST",
      body: JSON.stringify({ farmId, reportType: "today", fileType: "json" }),
    });
    assert.equal(status, 201);
    assert.equal(body.data.farmId, farmId);
    assert.equal(body.data.fileType, "json");
    assert.equal(body.data.status, "completed");
    assert.ok(body.data.downloadUrl.includes("/download"));
    createdReportId = body.data.id;
  });

  test("POST /reports/generate reuses an identical report instead of duplicating it", async () => {
    const { status, body } = await api("/reports/generate", {
      method: "POST",
      body: JSON.stringify({ farmId, reportType: "today", fileType: "json" }),
    });
    assert.equal(status, 201);
    assert.equal(body.data.id, createdReportId);
    assert.match(body.message, /already exists/i);
  });

  test("POST /reports/generate with forceRegenerate=true creates a new row", async () => {
    const { status, body } = await api("/reports/generate", {
      method: "POST",
      body: JSON.stringify({
        farmId,
        reportType: "today",
        fileType: "json",
        forceRegenerate: true,
      }),
    });
    assert.equal(status, 201);
    assert.notEqual(body.data.id, createdReportId);
  });

  test("GET /reports lists only this user's reports", async () => {
    const { status, body } = await api("/reports");
    assert.equal(status, 200);
    assert.ok(body.data.count >= 2);
    assert.ok(body.data.reports.every((r) => r.farmId === farmId));
  });

  test("GET /reports/:id returns full detail with data snapshot", async () => {
    const { status, body } = await api(`/reports/${createdReportId}`);
    assert.equal(status, 200);
    assert.equal(body.data.id, createdReportId);
    assert.ok(body.data.data.farm);
  });

  test("GET /reports/:id/download streams the JSON file", async () => {
    const res = await fetch(
      `${baseUrl}${env.apiPrefix}/reports/${createdReportId}/download`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    assert.equal(res.status, 200);
    assert.match(res.headers.get("content-type") || "", /application\/json/);
    const text = await res.text();
    assert.ok(text.includes("\"farm\""));
  });

  test("A second user cannot read the first user's report", async () => {
    const passwordHash = await bcrypt.hash("Test@12345", 4);
    const [otherUser] = await db
      .insert(users)
      .values({
        fullName: "Other User",
        email: `reports-other-${Date.now()}@example.com`,
        passwordHash,
      })
      .returning();
    const otherToken = jwtUtil.sign({ sub: otherUser.id, email: otherUser.email });

    const res = await fetch(`${baseUrl}${env.apiPrefix}/reports/${createdReportId}`, {
      headers: { Authorization: `Bearer ${otherToken}` },
    });
    assert.equal(res.status, 404);

    await db.delete(users).where(eq(users.id, otherUser.id));
  });

  test("DELETE /reports/:id removes the report", async () => {
    const { status } = await api(`/reports/${createdReportId}`, { method: "DELETE" });
    assert.equal(status, 200);

    const { status: getStatus } = await api(`/reports/${createdReportId}`);
    assert.equal(getStatus, 404);
  });
});
