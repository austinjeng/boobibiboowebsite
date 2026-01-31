import { describe, it, expect, beforeAll, afterEach, afterAll } from "vitest";
import { setupDbMock } from "../../helpers/db-mock";
import {
  setupTestDatabase,
  cleanDatabase,
  teardownTestDatabase,
} from "../../setup-db";
import { createTestRequest, parseResponse } from "../../helpers/api-helpers";
import { seedTestUser, seedBingoCard, seedRoom } from "../../helpers/db-seed";
import { getTestPool } from "../../setup-db";

// Must call before importing route handlers
setupDbMock();

// Import route handler AFTER mocks
import { GET } from "@/app/api/rooms/[code]/route";

const TEST_USER_ID = "test-user-rooms-code";
const TEST_USER_2_ID = "test-user-rooms-code-2";

describe("GET /api/rooms/[code]", () => {
  beforeAll(async () => {
    await setupTestDatabase();
  });

  afterEach(async () => {
    await cleanDatabase();
  });

  afterAll(async () => {
    await teardownTestDatabase();
  });

  it("returns 404 for non-existent room code", async () => {
    const request = createTestRequest("/api/rooms/NOROOM");
    const response = await GET(request, {
      params: Promise.resolve({ code: "NOROOM" }),
    });
    const { status, data } = await parseResponse<{ error: string }>(response);

    expect(status).toBe(404);
    expect(data.error).toBe("Room not found");
  });

  it("returns room info with members", async () => {
    await seedTestUser(TEST_USER_ID, { name: "Alice" });
    await seedTestUser(TEST_USER_2_ID, { name: "Bob" });
    const bingoCard = await seedBingoCard({ theme: "Cafe Crawl" });
    const room = await seedRoom(bingoCard.id, TEST_USER_ID, "CAFE01");

    // Add second member to the room
    const pool = getTestPool();
    await pool.query(
      `INSERT INTO room_member (room_id, user_id) VALUES ($1, $2)`,
      [room.id, TEST_USER_2_ID]
    );

    const request = createTestRequest("/api/rooms/CAFE01");
    const response = await GET(request, {
      params: Promise.resolve({ code: "CAFE01" }),
    });
    const { status, data } = await parseResponse<{
      room: {
        id: string;
        code: string;
        bingo_card_id: string;
        created_by: string;
        created_at: string;
        theme: string;
      };
      members: Array<{
        user_id: string;
        user_name: string;
        user_image: string | null;
        joined_at: string;
      }>;
    }>(response);

    expect(status).toBe(200);

    // Verify room info
    expect(data.room).toBeDefined();
    expect(data.room.id).toBe(room.id);
    expect(data.room.code).toBe("CAFE01");
    expect(data.room.bingo_card_id).toBe(bingoCard.id);
    expect(data.room.created_by).toBe(TEST_USER_ID);
    expect(data.room.theme).toBe("Cafe Crawl");
    expect(data.room.created_at).toBeDefined();

    // Verify members
    expect(data.members).toHaveLength(2);
    expect(data.members[0].user_id).toBe(TEST_USER_ID);
    expect(data.members[0].user_name).toBe("Alice");
    expect(data.members[0].joined_at).toBeDefined();
    expect(data.members[1].user_id).toBe(TEST_USER_2_ID);
    expect(data.members[1].user_name).toBe("Bob");
  });

  it("case-insensitive code lookup works", async () => {
    await seedTestUser(TEST_USER_ID, { name: "Alice" });
    const bingoCard = await seedBingoCard({ theme: "Night Market" });
    const room = await seedRoom(bingoCard.id, TEST_USER_ID, "ABCD12");

    // Query with lowercase code
    const requestLower = createTestRequest("/api/rooms/abcd12");
    const responseLower = await GET(requestLower, {
      params: Promise.resolve({ code: "abcd12" }),
    });
    const resultLower = await parseResponse<{
      room: { id: string; code: string };
      members: unknown[];
    }>(responseLower);

    expect(resultLower.status).toBe(200);
    expect(resultLower.data.room.id).toBe(room.id);
    expect(resultLower.data.room.code).toBe("ABCD12");

    // Query with mixed case code
    const requestMixed = createTestRequest("/api/rooms/AbCd12");
    const responseMixed = await GET(requestMixed, {
      params: Promise.resolve({ code: "AbCd12" }),
    });
    const resultMixed = await parseResponse<{
      room: { id: string; code: string };
      members: unknown[];
    }>(responseMixed);

    expect(resultMixed.status).toBe(200);
    expect(resultMixed.data.room.id).toBe(room.id);
    expect(resultMixed.data.room.code).toBe("ABCD12");
  });
});
