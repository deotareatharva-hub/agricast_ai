import { test, describe, after } from "node:test";
import assert from "node:assert/strict";
import { fileStorage } from "../../src/utils/fileStorage.js";

const FARM_ID = "33333333-3333-3333-3333-333333333333";
const REPORT_ID = "44444444-4444-4444-4444-444444444444";

describe("fileStorage", () => {
  after(async () => {
    // Clean up whatever this test wrote so repeated runs stay idempotent.
    await fileStorage.delete(`reports/${FARM_ID}/${REPORT_ID}.json`);
  });

  test("save() writes a file and returns a stable relative path", async () => {
    const relativePath = await fileStorage.save(
      FARM_ID,
      REPORT_ID,
      "json",
      JSON.stringify({ hello: "world" })
    );
    assert.equal(relativePath, `reports/${FARM_ID}/${REPORT_ID}.json`);
    assert.equal(fileStorage.exists(relativePath), true);
  });

  test("resolveAbsolutePath() rejects paths that escape the storage root", () => {
    assert.throws(() => fileStorage.resolveAbsolutePath("../../../etc/passwd"));
  });

  test("delete() removes the file so exists() then returns false", async () => {
    const relativePath = await fileStorage.save(FARM_ID, REPORT_ID, "json", "{}");
    assert.equal(fileStorage.exists(relativePath), true);
    await fileStorage.delete(relativePath);
    assert.equal(fileStorage.exists(relativePath), false);
  });
});
