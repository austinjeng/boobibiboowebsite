import { describe, it, expect, beforeAll, afterEach, afterAll } from "vitest";
import { setupAuthMock, setMockUser } from "../../helpers/auth-mock";
import { setupDbMock } from "../../helpers/db-mock";
import {
  setupTestDatabase,
  cleanDatabase,
  teardownTestDatabase,
} from "../../setup-db";
import { createTestRequest, parseResponse } from "../../helpers/api-helpers";
import { seedTestUser, seedBingoCard, seedRoom } from "../../helpers/db-seed";

// Must call before importing route handlers
setupAuthMock();
setupDbMock();

// Import route handlers AFTER mocks
import { GET, POST } from "@/app/api/rooms/route";

const TEST_USER_ID = "test-user-rooms";

describe("GET /api/rooms", () => {
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

  it("returns empty rooms when not authenticated", async () => {
    setMockUser(null);

    const response = await GET();
    const { status, data } = await parseResponse<{ rooms: unknown[] }>(
      response
    );

    expect(status).toBe(200);
    expect(data.rooms).toEqual([]);
  });

  it("returns user's rooms when authenticated", async () => {
    await seedTestUser(TEST_USER_ID);
    const card = await seedBingoCard({ theme: "Cafe Hopping" });
    const room = await seedRoom(card.id, TEST_USER_ID, "CAFE01");

    setMockUser(TEST_USER_ID);

    const response = await GET();
    const { status, data } = await parseResponse<{
      rooms: { id: string; code: string; theme: string }[];
    }>(response);

    expect(status).toBe(200);
    expect(data.rooms).toHaveLength(1);
    expect(data.rooms[0].id).toBe(room.id);
    expect(data.rooms[0].code).toBe("CAFE01");
    expect(data.rooms[0].theme).toBe("Cafe Hopping");
  });
});

describe("POST /api/rooms", () => {
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

  it("returns 401 when not authenticated", async () => {
    setMockUser(null);

    const request = createTestRequest("/api/rooms", {
      method: "POST",
      body: { bingoCardId: "some-card-id" },
    });

    const response = await POST(request);
    const { status, data } = await parseResponse<{ error: string }>(response);

    expect(status).toBe(401);
    expect(data.error).toBe("Unauthorized");
  });

  it("returns 400 when bingoCardId is missing", async () => {
    await seedTestUser(TEST_USER_ID);
    setMockUser(TEST_USER_ID);

    const request = createTestRequest("/api/rooms", {
      method: "POST",
      body: {},
    });

    const response = await POST(request);
    const { status, data } = await parseResponse<{ error: string }>(response);

    expect(status).toBe(400);
    expect(data.error).toBe("bingoCardId is required");
  });

  it("returns 404 when bingo card does not exist", async () => {
    await seedTestUser(TEST_USER_ID);
    setMockUser(TEST_USER_ID);

    const request = createTestRequest("/api/rooms", {
      method: "POST",
      body: { bingoCardId: "nonexistent-card-id" },
    });

    const response = await POST(request);
    const { status, data } = await parseResponse<{ error: string }>(response);

    expect(status).toBe(404);
    expect(data.error).toBe("Bingo card not found");
  });

  it("creates room successfully (201) with valid code", async () => {
    await seedTestUser(TEST_USER_ID);
    const card = await seedBingoCard({ theme: "Night Market Tour" });
    setMockUser(TEST_USER_ID);

    const request = createTestRequest("/api/rooms", {
      method: "POST",
      body: { bingoCardId: card.id },
    });

    const response = await POST(request);
    const { status, data } = await parseResponse<{
      room: { id: string; code: string; created_at: string };
    }>(response);

    expect(status).toBe(201);
    expect(data.room).toBeDefined();
    expect(data.room.id).toBeDefined();
    expect(data.room.code).toMatch(/^[A-HJ-NP-Z2-9]{6}$/);
    expect(data.room.created_at).toBeDefined();
  });
});
