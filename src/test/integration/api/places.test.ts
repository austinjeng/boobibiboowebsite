import { describe, it, expect, beforeAll, afterEach, afterAll } from "vitest";
import { setupAuthMock, setMockUser } from "../../helpers/auth-mock";
import { setupDbMock } from "../../helpers/db-mock";
import {
  setupTestDatabase,
  cleanDatabase,
  teardownTestDatabase,
} from "../../setup-db";
import { createTestRequest, parseResponse } from "../../helpers/api-helpers";
import { seedTestUser, seedPlace } from "../../helpers/db-seed";

// Must call before importing route handlers
setupAuthMock();
setupDbMock();

// Import route handler AFTER mocks
import { POST } from "@/app/api/places/route";

const TEST_USER_ID = "test-user-places";

describe("POST /api/places", () => {
  beforeAll(async () => {
    await setupTestDatabase();
    await seedTestUser(TEST_USER_ID);
  });

  afterEach(async () => {
    await cleanDatabase();
    await seedTestUser(TEST_USER_ID);
    setMockUser(null);
  });

  afterAll(async () => {
    await teardownTestDatabase();
  });

  it("returns 401 when not authenticated", async () => {
    setMockUser(null);

    const request = createTestRequest("/api/places", {
      method: "POST",
      body: { name: "Test Place", lat: 25.033, lng: 121.565 },
    });

    const response = await POST(request);
    const { status, data } = await parseResponse<{ error: string }>(response);

    expect(status).toBe(401);
    expect(data.error).toBe("Unauthorized");
  });

  it("returns 400 when name is missing", async () => {
    setMockUser(TEST_USER_ID);

    const request = createTestRequest("/api/places", {
      method: "POST",
      body: { lat: 25.033, lng: 121.565 },
    });

    const response = await POST(request);
    const { status, data } = await parseResponse<{ error: string }>(response);

    expect(status).toBe(400);
    expect(data.error).toBe("name, lat, and lng are required");
  });

  it("returns 400 when lat is missing", async () => {
    setMockUser(TEST_USER_ID);

    const request = createTestRequest("/api/places", {
      method: "POST",
      body: { name: "Test Place", lng: 121.565 },
    });

    const response = await POST(request);
    const { status, data } = await parseResponse<{ error: string }>(response);

    expect(status).toBe(400);
    expect(data.error).toBe("name, lat, and lng are required");
  });

  it("returns 400 when lng is missing", async () => {
    setMockUser(TEST_USER_ID);

    const request = createTestRequest("/api/places", {
      method: "POST",
      body: { name: "Test Place", lat: 25.033 },
    });

    const response = await POST(request);
    const { status, data } = await parseResponse<{ error: string }>(response);

    expect(status).toBe(400);
    expect(data.error).toBe("name, lat, and lng are required");
  });

  it("creates a place successfully (201)", async () => {
    setMockUser(TEST_USER_ID);

    const request = createTestRequest("/api/places", {
      method: "POST",
      body: { name: "Taipei 101", lat: 25.0339, lng: 121.5645 },
    });

    const response = await POST(request);
    const { status, data } = await parseResponse<{
      place: {
        id: string;
        name: string;
        lat: number;
        lng: number;
        external_place_id: string | null;
        created_at: string;
      };
    }>(response);

    expect(status).toBe(201);
    expect(data.place).toBeDefined();
    expect(data.place.id).toBeDefined();
    expect(data.place.name).toBe("Taipei 101");
    expect(Number(data.place.lat)).toBeCloseTo(25.0339);
    expect(Number(data.place.lng)).toBeCloseTo(121.5645);
    expect(data.place.external_place_id).toBeNull();
    expect(data.place.created_at).toBeDefined();
  });

  it("returns existing place if externalPlaceId already exists (deduplication)", async () => {
    setMockUser(TEST_USER_ID);

    const existingPlace = await seedPlace({
      name: "Existing Place",
      lat: 25.04,
      lng: 121.57,
      externalPlaceId: "google-place-abc123",
    });

    const request = createTestRequest("/api/places", {
      method: "POST",
      body: {
        name: "Duplicate Place",
        lat: 99.0,
        lng: 99.0,
        externalPlaceId: "google-place-abc123",
      },
    });

    const response = await POST(request);
    const { status, data } = await parseResponse<{
      place: { id: string };
    }>(response);

    expect(status).toBe(200);
    expect(data.place.id).toBe(existingPlace.id);
  });

  it("creates a new place when externalPlaceId is different", async () => {
    setMockUser(TEST_USER_ID);

    const existingPlace = await seedPlace({
      name: "Existing Place",
      lat: 25.04,
      lng: 121.57,
      externalPlaceId: "google-place-abc123",
    });

    const request = createTestRequest("/api/places", {
      method: "POST",
      body: {
        name: "New Place",
        lat: 25.05,
        lng: 121.58,
        externalPlaceId: "google-place-xyz789",
      },
    });

    const response = await POST(request);
    const { status, data } = await parseResponse<{
      place: {
        id: string;
        name: string;
        external_place_id: string | null;
      };
    }>(response);

    expect(status).toBe(201);
    expect(data.place.id).not.toBe(existingPlace.id);
    expect(data.place.name).toBe("New Place");
    expect(data.place.external_place_id).toBe("google-place-xyz789");
  });
});
