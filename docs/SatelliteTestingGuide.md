# Satellite Module — Testing Guide

---

## Backend Unit Tests

### `indexCalculator.test.js`

```js
import { computeHealthScore, assessCropHealth, classifyNdvi, gradeHealthScore } from "../src/modules/satellite/indexCalculator.js";

// Health score
test("returns 0 score for 0 scenes", () => {
  const { score } = computeHealthScore({ sceneCount: 0, scenes: [] });
  expect(score).toBeLessThan(30);
});

test("returns high score for many clear scenes", () => {
  const scenes = Array.from({ length: 5 }, () => ({ cloudCoverPercent: 5 }));
  const { score, grade } = computeHealthScore({ sceneCount: 5, scenes });
  expect(score).toBeGreaterThan(70);
  expect(["A", "B"]).toContain(grade);
});

test("penalizes high cloud cover", () => {
  const scenes = [{ cloudCoverPercent: 95 }];
  const { score } = computeHealthScore({ sceneCount: 1, scenes });
  expect(score).toBeLessThan(50);
});

// NDVI classification
test("classifies water correctly", () => {
  expect(classifyNdvi(-0.5).level).toBe("water");
});

test("classifies healthy vegetation", () => {
  expect(classifyNdvi(0.65).level).toBe("healthy");
});

// Crop assessment
test("recommends irrigation for low NDVI", () => {
  const { recommendations } = assessCropHealth({ ndvi: 0.1 });
  expect(recommendations.some(r => r.toLowerCase().includes("irrigation") || r.toLowerCase().includes("stressed"))).toBe(true);
});
```

### `imageProcessor.test.js`

```js
import { bufferToBase64, base64ToBuffer, clampIndex, ndviToRgb } from "../src/modules/satellite/imageProcessor.js";

test("round-trips buffer through base64", () => {
  const buf = Buffer.from("hello satellite");
  expect(base64ToBuffer(bufferToBase64(buf)).toString()).toBe("hello satellite");
});

test("clamps NDVI to [-1, 1]", () => {
  expect(clampIndex(2)).toBe(1);
  expect(clampIndex(-5)).toBe(-1);
});

test("returns blue for water (NDVI < 0)", () => {
  const { b } = ndviToRgb(-0.5);
  expect(b).toBeGreaterThan(100);
});

test("returns green for healthy vegetation (NDVI 0.7)", () => {
  const { g, r } = ndviToRgb(0.7);
  expect(g).toBeGreaterThan(r);
});
```

### `cache.service.test.js`

```js
import { cacheService } from "../src/modules/satellite/cache.service.js";

test("isFresh returns false for expired cache", () => {
  const row = { expiresAt: new Date(Date.now() - 1000) };
  expect(cacheService.isFresh(row)).toBe(false);
});

test("isFresh returns true for future expiry", () => {
  const row = { expiresAt: new Date(Date.now() + 60000) };
  expect(cacheService.isFresh(row)).toBe(true);
});

test("isFresh returns false for null expiresAt", () => {
  expect(cacheService.isFresh({ expiresAt: null })).toBe(false);
});

test("expiresAt is in the future", () => {
  const exp = cacheService.expiresAt();
  expect(exp.getTime()).toBeGreaterThan(Date.now());
});
```

---

## Backend Integration Tests (API-level)

```js
// satellite.api.test.js
// Requires a running backend and authenticated user (see existing tests for auth pattern)

describe("Satellite API", () => {
  let token, farmId;

  beforeAll(async () => {
    // register + login + create farm (see auth.api.test.js pattern)
  });

  test("GET /layers returns supported layers", async () => {
    const res = await request.get("/api/v1/satellite/layers").set("Authorization", `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.data.layers.length).toBeGreaterThan(0);
    expect(res.body.data.layers[0]).toHaveProperty("id");
    expect(res.body.data.layers[0]).toHaveProperty("label");
  });

  test("GET /health/:farmId returns health score", async () => {
    const res = await request.get(`/api/v1/satellite/health/${farmId}`).set("Authorization", `Bearer ${token}`);
    expect([200, 503]).toContain(res.status); // 503 if Sentinel Hub not configured
  });

  test("GET /health/:farmId with invalid farmId returns 400", async () => {
    const res = await request.get("/api/v1/satellite/health/not-a-uuid").set("Authorization", `Bearer ${token}`);
    expect(res.status).toBe(400);
  });

  test("GET /current/:farmId without auth returns 401", async () => {
    const res = await request.get(`/api/v1/satellite/current/${farmId}`);
    expect(res.status).toBe(401);
  });

  test("POST /refresh/:farmId clears cache", async () => {
    const res = await request.post(`/api/v1/satellite/refresh/${farmId}`).set("Authorization", `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.data).toHaveProperty("invalidatedRows");
  });

  test("GET /timelapse/:farmId returns 3 frames", async () => {
    const res = await request.get(`/api/v1/satellite/timelapse/${farmId}`).set("Authorization", `Bearer ${token}`);
    expect([200, 503]).toContain(res.status);
    if (res.status === 200) {
      expect(res.body.data.frameCount).toBe(3);
    }
  });
});
```

---

## Frontend Testing

### useSatelliteCurrent hook

```js
// useSatelliteCurrent.test.js
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useSatelliteCurrent } from "../src/features/satellite/hooks/useSatelliteCurrent";

// Mock satelliteApi
vi.mock("../src/features/satellite/api/satellite.api", () => ({
  satelliteApi: {
    getCurrent: vi.fn().mockResolvedValue({
      success: true,
      data: {
        farmId: "farm-1",
        image: { imageBase64: "abc", mimeType: "image/png" },
        metadata: { sceneCount: 2, scenes: [], latestCapture: null, avgCloudCover: 20 },
        health: { score: 72, grade: "B", description: "Good" },
      },
    }),
  },
}));

test("returns satellite data for a farmId", async () => {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  const wrapper = ({ children }) => <QueryClientProvider client={client}>{children}</QueryClientProvider>;

  const { result } = renderHook(() => useSatelliteCurrent("farm-1"), { wrapper });
  await waitFor(() => expect(result.current.isSuccess).toBe(true));
  expect(result.current.data.health.grade).toBe("B");
});

test("does not fire when farmId is undefined", () => {
  const client = new QueryClient();
  const wrapper = ({ children }) => <QueryClientProvider client={client}>{children}</QueryClientProvider>;
  const { result } = renderHook(() => useSatelliteCurrent(undefined), { wrapper });
  expect(result.current.fetchStatus).toBe("idle");
});
```

### Component snapshot: HealthScoreCard

```js
test("renders grade badge", () => {
  const health = { score: 85, grade: "A", description: "Excellent" };
  render(<HealthScoreCard health={health} />);
  expect(screen.getByText("A")).toBeInTheDocument();
  expect(screen.getByText(/Excellent/)).toBeInTheDocument();
});
```

---

## Manual QA Checklist

- [ ] Open `/dashboard/satellite` — farm picker renders
- [ ] Select a farm — hero, stats, map, cards all load
- [ ] Switch layer to NDVI — NDVICard updates; legend shows NDVI ramp
- [ ] Switch layer to TRUE_COLOR — legend shows "True Color note"
- [ ] Click "Refresh Data" — toast/success message shows; data reloads
- [ ] Open Timeline tab — 3 time periods visible; images load per tab
- [ ] Drag comparison slider — before/after swap correctly
- [ ] Open History tab — last 30 days default; change to last 7 days; list updates
- [ ] Switch language to हिंदी — all satellite text translates
- [ ] Switch language to मराठी — all satellite text translates
- [ ] Test on mobile viewport (375px) — layout is single column, readable
- [ ] Disconnect backend — SatelliteError card shows with retry button
