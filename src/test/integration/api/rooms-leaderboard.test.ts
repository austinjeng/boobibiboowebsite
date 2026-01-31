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
  getTestPool,
} from "../../setup-db";
import { createTestRequest, parseResponse } from "../../helpers/api-helpers";
import {
  seedTestUser,
  seedBingoCard,
  seedBingoTasks,
  seedPlace,
  seedCheckIn,
  seedRoom,
  seedBingoCompletion,
} from "../../helpers/db-seed";

// Must be called before importing route handlers (Vitest hoists vi.mock)
setupAuthMock();
setupDbMock();

import { GET } from "@/app/api/rooms/[code]/leaderboard/route";

interface LeaderboardEntry {
  user_id: string;
  user_name: string;
  user_image: string | null;
  completed_count: number;
  completed_lines: number;
}

interface LeaderboardResponse {
  leaderboard: LeaderboardEntry[];
}

/** Helper to add a user as a room member (seedRoom only adds the creator). */
async function addRoomMember(roomId: string, userId: string) {
  const pool = getTestPool();
  await pool.query(
    `INSERT INTO room_member (room_id, user_id) VALUES ($1, $2)`,
    [roomId, userId]
  );
}

describe("GET /api/rooms/[code]/leaderboard", () => {
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

  it("returns 404 for non-existent room", async () => {
    const req = createTestRequest("/api/rooms/NOPE99/leaderboard");

    const response = await GET(req, {
      params: Promise.resolve({ code: "NOPE99" }),
    });
    const { status, data } = await parseResponse<{ error: string }>(response);

    expect(status).toBe(404);
    expect(data).toEqual({ error: "Room not found" });
  });

  it("returns leaderboard with zero-completion members", async () => {
    const user = await seedTestUser("user-1", { name: "Alice" });
    const bingoCard = await seedBingoCard();
    await seedBingoTasks(bingoCard.id, 25);
    await seedRoom(bingoCard.id, user.id, "ZERO01");

    const req = createTestRequest("/api/rooms/ZERO01/leaderboard");

    const response = await GET(req, {
      params: Promise.resolve({ code: "ZERO01" }),
    });
    const { status, data } = await parseResponse<LeaderboardResponse>(response);

    expect(status).toBe(200);
    expect(data.leaderboard).toHaveLength(1);
    expect(data.leaderboard[0]).toMatchObject({
      user_id: user.id,
      user_name: "Alice",
      user_image: null,
      completed_count: 0,
      completed_lines: 0,
    });
  });

  it("sorts by completed_lines DESC then completed_count DESC", async () => {
    // User A: completes an entire row (indices 0-4) = 1 line, 5 completions
    // User B: completes 6 scattered tasks (no full line) = 0 lines, 6 completions
    // User C: completes an entire row (indices 0-4) + 2 extra = 1 line, 7 completions
    // Expected order: C (1 line, 7 count), A (1 line, 5 count), B (0 lines, 6 count)

    const userA = await seedTestUser("user-a", { name: "UserA" });
    const userB = await seedTestUser("user-b", { name: "UserB", email: "userb@test.com" });
    const userC = await seedTestUser("user-c", { name: "UserC", email: "userc@test.com" });

    const bingoCard = await seedBingoCard();
    const tasks = await seedBingoTasks(bingoCard.id, 25);
    const place = await seedPlace();

    const room = await seedRoom(bingoCard.id, userA.id, "SORT01");
    await addRoomMember(room.id, userB.id);
    await addRoomMember(room.id, userC.id);

    // User A: complete first row (indices 0-4) -> 1 line, 5 tasks
    for (let i = 0; i < 5; i++) {
      const checkIn = await seedCheckIn(userA.id, place.id, {
        note: `A task ${i}`,
        happyTags: ["vibe_good"],
      });
      await seedBingoCompletion(userA.id, tasks[i].id, checkIn.id);
    }

    // User B: complete 6 scattered tasks (indices 0,1,2,5,10,15) -> 0 lines, 6 tasks
    const scatteredIndices = [0, 1, 2, 5, 10, 15];
    for (const idx of scatteredIndices) {
      const checkIn = await seedCheckIn(userB.id, place.id, {
        note: `B task ${idx}`,
        happyTags: ["vibe_good"],
      });
      await seedBingoCompletion(userB.id, tasks[idx].id, checkIn.id);
    }

    // User C: complete first row (indices 0-4) + 2 extras (indices 5,6) -> 1 line, 7 tasks
    for (let i = 0; i < 7; i++) {
      const checkIn = await seedCheckIn(userC.id, place.id, {
        note: `C task ${i}`,
        happyTags: ["vibe_good"],
      });
      await seedBingoCompletion(userC.id, tasks[i].id, checkIn.id);
    }

    const req = createTestRequest("/api/rooms/SORT01/leaderboard");
    const response = await GET(req, {
      params: Promise.resolve({ code: "SORT01" }),
    });
    const { status, data } = await parseResponse<LeaderboardResponse>(response);

    expect(status).toBe(200);
    expect(data.leaderboard).toHaveLength(3);

    // C first: 1 line, 7 completions
    expect(data.leaderboard[0]).toMatchObject({
      user_id: userC.id,
      user_name: "UserC",
      completed_count: 7,
      completed_lines: 1,
    });

    // A second: 1 line, 5 completions
    expect(data.leaderboard[1]).toMatchObject({
      user_id: userA.id,
      user_name: "UserA",
      completed_count: 5,
      completed_lines: 1,
    });

    // B third: 0 lines, 6 completions
    expect(data.leaderboard[2]).toMatchObject({
      user_id: userB.id,
      user_name: "UserB",
      completed_count: 6,
      completed_lines: 0,
    });
  });

  it("includes all members even with no completions", async () => {
    const userWithCompletions = await seedTestUser("user-with", {
      name: "Achiever",
    });
    const userWithout = await seedTestUser("user-without", {
      name: "NewMember",
      email: "newmember@test.com",
    });

    const bingoCard = await seedBingoCard();
    const tasks = await seedBingoTasks(bingoCard.id, 25);
    const place = await seedPlace();

    const room = await seedRoom(bingoCard.id, userWithCompletions.id, "INCL01");
    await addRoomMember(room.id, userWithout.id);

    // Only the first user completes some tasks
    const checkIn = await seedCheckIn(userWithCompletions.id, place.id, {
      note: "Done a task",
      happyTags: ["vibe_good"],
    });
    await seedBingoCompletion(userWithCompletions.id, tasks[0].id, checkIn.id);

    const req = createTestRequest("/api/rooms/INCL01/leaderboard");
    const response = await GET(req, {
      params: Promise.resolve({ code: "INCL01" }),
    });
    const { status, data } = await parseResponse<LeaderboardResponse>(response);

    expect(status).toBe(200);
    expect(data.leaderboard).toHaveLength(2);

    // User with completions should be first
    expect(data.leaderboard[0]).toMatchObject({
      user_id: userWithCompletions.id,
      user_name: "Achiever",
      completed_count: 1,
      completed_lines: 0,
    });

    // User without completions should still appear
    expect(data.leaderboard[1]).toMatchObject({
      user_id: userWithout.id,
      user_name: "NewMember",
      completed_count: 0,
      completed_lines: 0,
    });
  });

  it("finds room by code case-insensitively", async () => {
    const user = await seedTestUser("user-case", { name: "CaseUser" });
    const bingoCard = await seedBingoCard();
    await seedBingoTasks(bingoCard.id, 25);
    await seedRoom(bingoCard.id, user.id, "ABCDEF");

    // Query with lowercase code
    const req = createTestRequest("/api/rooms/abcdef/leaderboard");
    const response = await GET(req, {
      params: Promise.resolve({ code: "abcdef" }),
    });
    const { status, data } = await parseResponse<LeaderboardResponse>(response);

    expect(status).toBe(200);
    expect(data.leaderboard).toHaveLength(1);
    expect(data.leaderboard[0].user_name).toBe("CaseUser");
  });
});
