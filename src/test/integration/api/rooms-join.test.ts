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

// Import route handler AFTER mocks
import { POST } from "@/app/api/rooms/join/route";

const TEST_USER_ID = "test-user-join";
const OTHER_USER_ID = "test-user-owner";

describe("POST /api/rooms/join", () => {
  let bingoCard: { id: string };

  beforeAll(async () => {
    await setupTestDatabase();
    await seedTestUser(TEST_USER_ID);
    await seedTestUser(OTHER_USER_ID, { name: "Room Owner", email: "owner@test.com" });
    bingoCard = await seedBingoCard({ theme: "Join Room Test" });
  });

  afterEach(async () => {
    await cleanDatabase();
    await seedTestUser(TEST_USER_ID);
    await seedTestUser(OTHER_USER_ID, { name: "Room Owner", email: "owner@test.com" });
    bingoCard = await seedBingoCard({ theme: "Join Room Test" });
    setMockUser(null);
  });

  afterAll(async () => {
    await teardownTestDatabase();
  });

  it("returns 401 when not authenticated", async () => {
    setMockUser(null);

    const request = createTestRequest("/api/rooms/join", {
      method: "POST",
      body: { code: "ABC123" },
    });

    const response = await POST(request);
    const { status, data } = await parseResponse<{ error: string }>(response);

    expect(status).toBe(401);
    expect(data.error).toBe("Unauthorized");
  });

  it("returns 404 when room code doesn't exist", async () => {
    setMockUser(TEST_USER_ID);

    const request = createTestRequest("/api/rooms/join", {
      method: "POST",
      body: { code: "NONEXISTENT" },
    });

    const response = await POST(request);
    const { status, data } = await parseResponse<{ error: string }>(response);

    expect(status).toBe(404);
    expect(data.error).toBe("Room not found");
  });

  it("joins room successfully", async () => {
    setMockUser(TEST_USER_ID);

    // Create a room owned by another user
    const room = await seedRoom(bingoCard.id, OTHER_USER_ID, "JOIN01");

    const request = createTestRequest("/api/rooms/join", {
      method: "POST",
      body: { code: "JOIN01" },
    });

    const response = await POST(request);
    const { status, data } = await parseResponse<{
      success: boolean;
      room: { id: string; code: string };
      message?: string;
    }>(response);

    expect(status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.room).toBeDefined();
    expect(data.room.id).toBe(room.id);
    expect(data.room.code).toBe("JOIN01");
    expect(data.message).toBeUndefined();
  });

  it('returns success with "Already a member" message when already joined', async () => {
    setMockUser(OTHER_USER_ID);

    // seedRoom already adds the creator as a member
    const room = await seedRoom(bingoCard.id, OTHER_USER_ID, "MEMBER");

    const request = createTestRequest("/api/rooms/join", {
      method: "POST",
      body: { code: "MEMBER" },
    });

    const response = await POST(request);
    const { status, data } = await parseResponse<{
      success: boolean;
      room: { id: string; code: string };
      message: string;
    }>(response);

    expect(status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.room).toBeDefined();
    expect(data.room.id).toBe(room.id);
    expect(data.message).toBe("Already a member");
  });

  it("handles case-insensitive code lookup", async () => {
    setMockUser(TEST_USER_ID);

    // Create room with uppercase code
    const room = await seedRoom(bingoCard.id, OTHER_USER_ID, "UPPER1");

    // Join with lowercase code
    const request = createTestRequest("/api/rooms/join", {
      method: "POST",
      body: { code: "upper1" },
    });

    const response = await POST(request);
    const { status, data } = await parseResponse<{
      success: boolean;
      room: { id: string; code: string };
    }>(response);

    expect(status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.room).toBeDefined();
    expect(data.room.id).toBe(room.id);
    // The returned code should be the original stored code
    expect(data.room.code).toBe("UPPER1");
  });
});
