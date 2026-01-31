import {
  describe,
  it,
  expect,
  beforeAll,
  afterEach,
  afterAll,
} from "vitest";
import { setupDbMock } from "../../helpers/db-mock";
import {
  setupTestDatabase,
  cleanDatabase,
  teardownTestDatabase,
} from "../../setup-db";
import { createTestRequest, parseResponse } from "../../helpers/api-helpers";
import { seedPlace } from "../../helpers/db-seed";

setupDbMock();

import { GET } from "@/app/api/places/search/route";

describe("GET /api/places/search", () => {
  beforeAll(async () => {
    await setupTestDatabase();
  });

  afterEach(async () => {
    await cleanDatabase();
  });

  afterAll(async () => {
    await teardownTestDatabase();
  });

  it("returns empty array when q is missing", async () => {
    const req = createTestRequest("/api/places/search");
    const res = await GET(req);
    const { status, data } = await parseResponse<{ places: unknown[] }>(res);

    expect(status).toBe(200);
    expect(data.places).toEqual([]);
  });

  it("returns empty array when q is 1 character", async () => {
    const req = createTestRequest("/api/places/search?q=A");
    const res = await GET(req);
    const { status, data } = await parseResponse<{ places: unknown[] }>(res);

    expect(status).toBe(200);
    expect(data.places).toEqual([]);
  });

  it("returns matching places for a 2+ character query", async () => {
    await seedPlace({ name: "Taipei 101" });
    await seedPlace({ name: "Taipei Arena" });
    await seedPlace({ name: "Shilin Night Market" });

    const req = createTestRequest("/api/places/search?q=Taipei");
    const res = await GET(req);
    const { status, data } = await parseResponse<{
      places: { id: string; name: string; lat: number; lng: number }[];
    }>(res);

    expect(status).toBe(200);
    expect(data.places).toHaveLength(2);
    expect(data.places.map((p) => p.name).sort()).toEqual([
      "Taipei 101",
      "Taipei Arena",
    ]);
  });

  it("search is case-insensitive (ILIKE)", async () => {
    await seedPlace({ name: "Blue Bottle Coffee" });

    const req = createTestRequest("/api/places/search?q=blue bottle");
    const res = await GET(req);
    const { status, data } = await parseResponse<{
      places: { id: string; name: string }[];
    }>(res);

    expect(status).toBe(200);
    expect(data.places).toHaveLength(1);
    expect(data.places[0].name).toBe("Blue Bottle Coffee");
  });

  it("limits results to 20", async () => {
    // Seed 25 places that all match the query
    const seedPromises = Array.from({ length: 25 }, (_, i) =>
      seedPlace({ name: `Cafe ${String(i).padStart(2, "0")}` })
    );
    await Promise.all(seedPromises);

    const req = createTestRequest("/api/places/search?q=Cafe");
    const res = await GET(req);
    const { status, data } = await parseResponse<{
      places: { id: string; name: string }[];
    }>(res);

    expect(status).toBe(200);
    expect(data.places).toHaveLength(20);
  });
});
