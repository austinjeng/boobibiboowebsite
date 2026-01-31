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

// Must be called before importing route handlers (Vitest hoists vi.mock)
setupAuthMock();
setupDbMock();

import { POST, GET } from "@/app/api/checkins/route";

describe("POST /api/checkins", () => {
  beforeAll(async () => {
    await setupTestDatabase();
  });

  afterEach(async () => {
    setMockUser(null);
    await cleanDatabase();
  });

  afterAll(async () => {
    await teardownTestDatabase();
  });

  it("returns 401 when not authenticated", async () => {
    setMockUser(null);

    const req = createTestRequest("/api/checkins", {
      method: "POST",
      body: {
        placeId: "some-place-id",
        note: "Great place",
        happyTags: ["vibe_good"],
      },
    });

    const { status, data } = await parseResponse(await POST(req));

    expect(status).toBe(401);
    expect(data).toEqual({ error: "Unauthorized" });
  });

  it("returns 400 when placeId is missing", async () => {
    const user = await seedTestUser("user-1");
    setMockUser(user.id);

    const req = createTestRequest("/api/checkins", {
      method: "POST",
      body: {
        note: "Great place",
        happyTags: ["vibe_good"],
      },
    });

    const { status, data } = await parseResponse(await POST(req));

    expect(status).toBe(400);
    expect(data).toEqual({ error: "placeId is required" });
  });

  it("returns 400 when neither note nor photoUrl is provided", async () => {
    const user = await seedTestUser("user-1");
    setMockUser(user.id);
    const place = await seedPlace();

    const req = createTestRequest("/api/checkins", {
      method: "POST",
      body: {
        placeId: place.id,
        happyTags: ["vibe_good"],
      },
    });

    const { status, data } = await parseResponse(await POST(req));

    expect(status).toBe(400);
    expect(data).toEqual({ error: "Either note or photoUrl is required" });
  });

  it("returns 400 when no happyTags provided", async () => {
    const user = await seedTestUser("user-1");
    setMockUser(user.id);
    const place = await seedPlace();

    const req = createTestRequest("/api/checkins", {
      method: "POST",
      body: {
        placeId: place.id,
        note: "Great place",
        happyTags: [],
      },
    });

    const { status, data } = await parseResponse(await POST(req));

    expect(status).toBe(400);
    expect(data).toEqual({ error: "At least one happy tag is required" });
  });

  it("returns 400 when invalid happy tag", async () => {
    const user = await seedTestUser("user-1");
    setMockUser(user.id);
    const place = await seedPlace();

    const req = createTestRequest("/api/checkins", {
      method: "POST",
      body: {
        placeId: place.id,
        note: "Great place",
        happyTags: ["not_a_real_tag"],
      },
    });

    const { status, data } = await parseResponse(await POST(req));

    expect(status).toBe(400);
    expect(data).toEqual({ error: "Invalid happy tag" });
  });

  it("returns 400 when invalid caution tag", async () => {
    const user = await seedTestUser("user-1");
    setMockUser(user.id);
    const place = await seedPlace();

    const req = createTestRequest("/api/checkins", {
      method: "POST",
      body: {
        placeId: place.id,
        note: "Great place",
        happyTags: ["vibe_good"],
        cautions: ["fake_caution"],
      },
    });

    const { status, data } = await parseResponse(await POST(req));

    expect(status).toBe(400);
    expect(data).toEqual({ error: "Invalid caution tag" });
  });

  it("returns 400 when invalid context tag", async () => {
    const user = await seedTestUser("user-1");
    setMockUser(user.id);
    const place = await seedPlace();

    const req = createTestRequest("/api/checkins", {
      method: "POST",
      body: {
        placeId: place.id,
        note: "Great place",
        happyTags: ["vibe_good"],
        contexts: ["fake_context"],
      },
    });

    const { status, data } = await parseResponse(await POST(req));

    expect(status).toBe(400);
    expect(data).toEqual({ error: "Invalid context tag" });
  });

  it("creates check-in successfully with 201", async () => {
    const user = await seedTestUser("user-1");
    setMockUser(user.id);
    const place = await seedPlace();

    const req = createTestRequest("/api/checkins", {
      method: "POST",
      body: {
        placeId: place.id,
        note: "Amazing atmosphere and great coffee!",
        photoUrl: "https://example.com/photo.jpg",
        happyTags: ["vibe_good", "good_value"],
        cautions: ["long_queue"],
        contexts: ["friends"],
      },
    });

    const { status, data } = await parseResponse<{
      checkIn: { id: string; created_at: string };
    }>(await POST(req));

    expect(status).toBe(201);
    expect(data.checkIn).toBeDefined();
    expect(data.checkIn.id).toBeDefined();
    expect(data.checkIn.created_at).toBeDefined();
  });
});

describe("GET /api/checkins", () => {
  beforeAll(async () => {
    await setupTestDatabase();
  });

  afterEach(async () => {
    setMockUser(null);
    await cleanDatabase();
  });

  afterAll(async () => {
    await teardownTestDatabase();
  });

  it("returns check-ins for current user", async () => {
    const user = await seedTestUser("user-1");
    const otherUser = await seedTestUser("user-2", {
      email: "other@test.com",
    });
    const place = await seedPlace();

    await seedCheckIn(user.id, place.id, {
      note: "My check-in",
      happyTags: ["vibe_good"],
    });
    await seedCheckIn(otherUser.id, place.id, {
      note: "Other user check-in",
      happyTags: ["quiet"],
    });

    setMockUser(user.id);

    const req = createTestRequest("/api/checkins", { method: "GET" });
    const { status, data } = await parseResponse<{
      checkIns: Array<{ user_id: string; note: string }>;
    }>(await GET(req));

    expect(status).toBe(200);
    expect(data.checkIns).toHaveLength(1);
    expect(data.checkIns[0].user_id).toBe(user.id);
    expect(data.checkIns[0].note).toBe("My check-in");
  });

  it("filters by happyTag", async () => {
    const user = await seedTestUser("user-1");
    const place = await seedPlace();

    await seedCheckIn(user.id, place.id, {
      note: "Good vibes",
      happyTags: ["vibe_good", "healing"],
    });
    await seedCheckIn(user.id, place.id, {
      note: "Great view spot",
      happyTags: ["great_view"],
    });

    setMockUser(user.id);

    const req = createTestRequest("/api/checkins?happyTag=great_view", {
      method: "GET",
    });
    const { status, data } = await parseResponse<{
      checkIns: Array<{ note: string; happy_tags: string[] }>;
    }>(await GET(req));

    expect(status).toBe(200);
    expect(data.checkIns).toHaveLength(1);
    expect(data.checkIns[0].note).toBe("Great view spot");
    expect(data.checkIns[0].happy_tags).toContain("great_view");
  });

  it("filters by placeId", async () => {
    const user = await seedTestUser("user-1");
    const placeA = await seedPlace({ name: "Place A" });
    const placeB = await seedPlace({ name: "Place B" });

    await seedCheckIn(user.id, placeA.id, {
      note: "Check-in at A",
      happyTags: ["vibe_good"],
    });
    await seedCheckIn(user.id, placeB.id, {
      note: "Check-in at B",
      happyTags: ["quiet"],
    });

    setMockUser(user.id);

    const req = createTestRequest(`/api/checkins?placeId=${placeA.id}`, {
      method: "GET",
    });
    const { status, data } = await parseResponse<{
      checkIns: Array<{ note: string; place_id: string }>;
    }>(await GET(req));

    expect(status).toBe(200);
    expect(data.checkIns).toHaveLength(1);
    expect(data.checkIns[0].note).toBe("Check-in at A");
    expect(data.checkIns[0].place_id).toBe(placeA.id);
  });
});
