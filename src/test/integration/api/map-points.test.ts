import {
  describe,
  it,
  expect,
  beforeAll,
  afterEach,
  afterAll,
} from "vitest";
import { setupAuthMock, setMockUser } from "../../helpers/auth-mock";
import { setupDbMock } from "../../helpers/db-mock";
import {
  setupTestDatabase,
  cleanDatabase,
  teardownTestDatabase,
} from "../../setup-db";
import { createTestRequest, parseResponse } from "../../helpers/api-helpers";
import { seedTestUser, seedPlace, seedCheckIn } from "../../helpers/db-seed";

// Must call before importing route handlers
setupAuthMock();
setupDbMock();

// Import route handler AFTER mocks
import { GET } from "@/app/api/map/points/route";

const TEST_USER_ID = "test-user-map-points";

interface MapPoint {
  place_id: string;
  place_name: string;
  lat: number;
  lng: number;
  check_in_count: number;
  happy_tags: string[];
  latest_note: string | null;
  latest_photo_url: string | null;
  cautions: string[];
}

describe("GET /api/map/points", () => {
  beforeAll(async () => {
    await setupTestDatabase();
  });

  afterEach(async () => {
    await cleanDatabase();
    setMockUser(null);
  });

  afterAll(async () => {
    await teardownTestDatabase();
  });

  it("returns empty array when no check-ins exist", async () => {
    setMockUser(TEST_USER_ID);
    await seedTestUser(TEST_USER_ID);

    const req = createTestRequest("/api/map/points");
    const res = await GET(req);
    const { status, data } = await parseResponse<{ points: MapPoint[] }>(res);

    expect(status).toBe(200);
    expect(data.points).toEqual([]);
  });

  it("returns aggregated points for logged-in user", async () => {
    await seedTestUser(TEST_USER_ID);
    setMockUser(TEST_USER_ID);

    // Seed a second user whose check-ins should NOT appear
    const otherUserId = "test-user-other";
    await seedTestUser(otherUserId, { name: "Other User" });

    const place1 = await seedPlace({ name: "Cafe Latte", lat: 25.033, lng: 121.565 });
    const place2 = await seedPlace({ name: "Tea House", lat: 25.04, lng: 121.57 });

    // Two check-ins at place1 for our user
    await seedCheckIn(TEST_USER_ID, place1.id, {
      note: "First visit",
      happyTags: ["vibe_good", "quiet"],
      cautions: ["pricey"],
      contexts: ["solo"],
    });
    await seedCheckIn(TEST_USER_ID, place1.id, {
      note: "Second visit",
      happyTags: ["healing"],
      cautions: [],
      contexts: ["friends"],
    });

    // One check-in at place2 for our user
    await seedCheckIn(TEST_USER_ID, place2.id, {
      note: "Nice tea",
      happyTags: ["good_value"],
      cautions: ["long_queue"],
      contexts: ["date"],
    });

    // A check-in from another user (should be excluded)
    await seedCheckIn(otherUserId, place1.id, {
      note: "Other user note",
      happyTags: ["photogenic"],
      cautions: [],
      contexts: [],
    });

    const req = createTestRequest("/api/map/points");
    const res = await GET(req);
    const { status, data } = await parseResponse<{ points: MapPoint[] }>(res);

    expect(status).toBe(200);
    expect(data.points).toHaveLength(2);

    // Results ordered by check_in_count DESC, so place1 (2 check-ins) comes first
    const cafe = data.points.find((p) => p.place_name === "Cafe Latte");
    const tea = data.points.find((p) => p.place_name === "Tea House");

    expect(cafe).toBeDefined();
    expect(cafe!.check_in_count).toBe(2);
    expect(cafe!.happy_tags).toEqual(expect.arrayContaining(["vibe_good", "quiet", "healing"]));
    expect(cafe!.cautions).toEqual(expect.arrayContaining(["pricey"]));
    // Latest note should be "Second visit" (most recent created_at)
    expect(cafe!.latest_note).toBe("Second visit");

    expect(tea).toBeDefined();
    expect(tea!.check_in_count).toBe(1);
    expect(tea!.happy_tags).toEqual(expect.arrayContaining(["good_value"]));
    expect(tea!.cautions).toEqual(expect.arrayContaining(["long_queue"]));
    expect(tea!.latest_note).toBe("Nice tea");
  });

  it("filters by happyTag", async () => {
    await seedTestUser(TEST_USER_ID);
    setMockUser(TEST_USER_ID);

    const place1 = await seedPlace({ name: "Quiet Spot", lat: 25.033, lng: 121.565 });
    const place2 = await seedPlace({ name: "Lively Bar", lat: 25.04, lng: 121.57 });

    await seedCheckIn(TEST_USER_ID, place1.id, {
      happyTags: ["quiet", "healing"],
    });
    await seedCheckIn(TEST_USER_ID, place2.id, {
      happyTags: ["vibe_good", "great_view"],
    });

    const req = createTestRequest("/api/map/points?happyTag=quiet");
    const res = await GET(req);
    const { status, data } = await parseResponse<{ points: MapPoint[] }>(res);

    expect(status).toBe(200);
    expect(data.points).toHaveLength(1);
    expect(data.points[0].place_name).toBe("Quiet Spot");
    expect(data.points[0].happy_tags).toEqual(expect.arrayContaining(["quiet"]));
  });

  it("filters by context", async () => {
    await seedTestUser(TEST_USER_ID);
    setMockUser(TEST_USER_ID);

    const place1 = await seedPlace({ name: "Date Cafe", lat: 25.033, lng: 121.565 });
    const place2 = await seedPlace({ name: "Work Cafe", lat: 25.04, lng: 121.57 });

    await seedCheckIn(TEST_USER_ID, place1.id, {
      happyTags: ["vibe_good"],
      contexts: ["date"],
    });
    await seedCheckIn(TEST_USER_ID, place2.id, {
      happyTags: ["quiet"],
      contexts: ["work"],
    });

    const req = createTestRequest("/api/map/points?context=date");
    const res = await GET(req);
    const { status, data } = await parseResponse<{ points: MapPoint[] }>(res);

    expect(status).toBe(200);
    expect(data.points).toHaveLength(1);
    expect(data.points[0].place_name).toBe("Date Cafe");
  });

  it("filters by search query (q param) using ILIKE", async () => {
    await seedTestUser(TEST_USER_ID);
    setMockUser(TEST_USER_ID);

    const place1 = await seedPlace({ name: "Blue Bottle Coffee", lat: 25.033, lng: 121.565 });
    const place2 = await seedPlace({ name: "Shilin Night Market", lat: 25.04, lng: 121.57 });
    const place3 = await seedPlace({ name: "Starbucks Coffee", lat: 25.05, lng: 121.58 });

    await seedCheckIn(TEST_USER_ID, place1.id, { happyTags: ["vibe_good"] });
    await seedCheckIn(TEST_USER_ID, place2.id, { happyTags: ["good_value"] });
    await seedCheckIn(TEST_USER_ID, place3.id, { happyTags: ["quiet"] });

    // Search for "coffee" (case-insensitive)
    const req = createTestRequest("/api/map/points?q=coffee");
    const res = await GET(req);
    const { status, data } = await parseResponse<{ points: MapPoint[] }>(res);

    expect(status).toBe(200);
    expect(data.points).toHaveLength(2);

    const names = data.points.map((p) => p.place_name).sort();
    expect(names).toEqual(["Blue Bottle Coffee", "Starbucks Coffee"]);
  });

  it("limits to 100 results", async () => {
    await seedTestUser(TEST_USER_ID);
    setMockUser(TEST_USER_ID);

    // Seed 105 places, each with one check-in
    const places = [];
    for (let i = 0; i < 105; i++) {
      const place = await seedPlace({
        name: `Place ${String(i).padStart(3, "0")}`,
        lat: 25.0 + i * 0.001,
        lng: 121.5 + i * 0.001,
      });
      places.push(place);
    }

    for (const place of places) {
      await seedCheckIn(TEST_USER_ID, place.id, {
        happyTags: ["vibe_good"],
      });
    }

    const req = createTestRequest("/api/map/points");
    const res = await GET(req);
    const { status, data } = await parseResponse<{ points: MapPoint[] }>(res);

    expect(status).toBe(200);
    expect(data.points).toHaveLength(100);
  });
});
