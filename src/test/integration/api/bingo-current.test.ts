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
import { parseResponse } from "../../helpers/api-helpers";
import {
  seedTestUser,
  seedBingoCard,
  seedBingoTasks,
  seedPlace,
  seedCheckIn,
  seedBingoCompletion,
} from "../../helpers/db-seed";

// Must call before importing route handlers
setupAuthMock();
setupDbMock();

// Import route handler AFTER mocks
import { GET } from "@/app/api/bingo/current/route";

const TEST_USER_ID = "test-user-bingo";

/**
 * Calculate the current week's Monday date string (YYYY-MM-DD).
 * This mirrors the logic in the route handler.
 */
function getCurrentWeekMonday(): string {
  const now = new Date();
  const dayOfWeek = now.getDay();
  const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
  const monday = new Date(now);
  monday.setDate(now.getDate() + mondayOffset);
  monday.setHours(0, 0, 0, 0);
  return monday.toISOString().split("T")[0];
}

describe("GET /api/bingo/current", () => {
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

  it("returns empty state when no card exists for current week", async () => {
    setMockUser(null);

    const response = await GET();
    const { status, data } = await parseResponse<{
      card: null;
      tasks: unknown[];
      completions: unknown[];
      completedCount: number;
      completedLines: number;
    }>(response);

    expect(status).toBe(200);
    expect(data.card).toBeNull();
    expect(data.tasks).toEqual([]);
    expect(data.completions).toEqual([]);
    expect(data.completedCount).toBe(0);
    expect(data.completedLines).toBe(0);
  });

  it("returns empty state when card exists for a different week", async () => {
    // Seed a card for a past week that does not match this week's Monday
    await seedBingoCard({ theme: "Old Week", weekStartDate: "2024-01-01" });

    const response = await GET();
    const { status, data } = await parseResponse<{
      card: null;
      tasks: unknown[];
      completions: unknown[];
      completedCount: number;
      completedLines: number;
    }>(response);

    expect(status).toBe(200);
    expect(data.card).toBeNull();
    expect(data.tasks).toEqual([]);
    expect(data.completions).toEqual([]);
    expect(data.completedCount).toBe(0);
    expect(data.completedLines).toBe(0);
  });

  it("returns card and tasks when card exists for current week", async () => {
    const weekStartDate = getCurrentWeekMonday();
    const card = await seedBingoCard({
      theme: "Current Week Theme",
      weekStartDate,
    });
    await seedBingoTasks(card.id, 25);

    const response = await GET();
    const { status, data } = await parseResponse<{
      card: { id: string; theme: string; week_start_date: string };
      tasks: { id: string; task_index: number; title: string }[];
      completions: unknown[];
      completedCount: number;
      completedLines: number;
    }>(response);

    expect(status).toBe(200);
    expect(data.card).toBeDefined();
    expect(data.card.id).toBe(card.id);
    expect(data.card.theme).toBe("Current Week Theme");
    expect(data.card.week_start_date).toContain(weekStartDate);
    expect(data.tasks).toHaveLength(25);
    // Tasks should be ordered by task_index
    expect(data.tasks[0].task_index).toBe(0);
    expect(data.tasks[24].task_index).toBe(24);
    // No user logged in, so completions should be empty
    expect(data.completions).toEqual([]);
    expect(data.completedCount).toBe(0);
    expect(data.completedLines).toBe(0);
  });

  it("returns zero completions when user is logged in but has none", async () => {
    await seedTestUser(TEST_USER_ID);
    setMockUser(TEST_USER_ID);

    const weekStartDate = getCurrentWeekMonday();
    const card = await seedBingoCard({
      theme: "Week Theme",
      weekStartDate,
    });
    await seedBingoTasks(card.id, 25);

    const response = await GET();
    const { status, data } = await parseResponse<{
      card: { id: string };
      tasks: { id: string }[];
      completions: unknown[];
      completedCount: number;
      completedLines: number;
    }>(response);

    expect(status).toBe(200);
    expect(data.card.id).toBe(card.id);
    expect(data.tasks).toHaveLength(25);
    expect(data.completions).toEqual([]);
    expect(data.completedCount).toBe(0);
    expect(data.completedLines).toBe(0);
  });

  it("returns completions when user is logged in and has completions", async () => {
    await seedTestUser(TEST_USER_ID);
    setMockUser(TEST_USER_ID);

    const weekStartDate = getCurrentWeekMonday();
    const card = await seedBingoCard({
      theme: "Completion Theme",
      weekStartDate,
    });
    const tasks = await seedBingoTasks(card.id, 25);

    // Create a check-in to link to the completion
    const place = await seedPlace({ name: "Bingo Place" });
    const checkIn = await seedCheckIn(TEST_USER_ID, place.id, {
      happyTags: ["vibe_good"],
    });

    // Complete 3 tasks (indices 0, 1, 2)
    await seedBingoCompletion(TEST_USER_ID, tasks[0].id, checkIn.id);
    await seedBingoCompletion(TEST_USER_ID, tasks[1].id, checkIn.id);
    await seedBingoCompletion(TEST_USER_ID, tasks[2].id, checkIn.id);

    const response = await GET();
    const { status, data } = await parseResponse<{
      card: { id: string };
      tasks: { id: string; task_index: number }[];
      completions: { bingo_task_id: string; check_in_id: string; completed_at: string }[];
      completedCount: number;
      completedLines: number;
    }>(response);

    expect(status).toBe(200);
    expect(data.card.id).toBe(card.id);
    expect(data.completions).toHaveLength(3);
    expect(data.completedCount).toBe(3);
    // 3 scattered tasks in first row do not complete any line
    expect(data.completedLines).toBe(0);

    // Verify completion references
    const completionTaskIds = data.completions.map((c) => c.bingo_task_id);
    expect(completionTaskIds).toContain(tasks[0].id);
    expect(completionTaskIds).toContain(tasks[1].id);
    expect(completionTaskIds).toContain(tasks[2].id);
    data.completions.forEach((c) => {
      expect(c.check_in_id).toBe(checkIn.id);
      expect(c.completed_at).toBeDefined();
    });
  });

  it("calculates completedLines correctly for one completed row", async () => {
    await seedTestUser(TEST_USER_ID);
    setMockUser(TEST_USER_ID);

    const weekStartDate = getCurrentWeekMonday();
    const card = await seedBingoCard({
      theme: "Row Completion",
      weekStartDate,
    });
    const tasks = await seedBingoTasks(card.id, 25);

    const place = await seedPlace({ name: "Row Place" });
    const checkIn = await seedCheckIn(TEST_USER_ID, place.id);

    // Complete first row: indices 0, 1, 2, 3, 4
    for (let i = 0; i < 5; i++) {
      await seedBingoCompletion(TEST_USER_ID, tasks[i].id, checkIn.id);
    }

    const response = await GET();
    const { status, data } = await parseResponse<{
      completedCount: number;
      completedLines: number;
    }>(response);

    expect(status).toBe(200);
    expect(data.completedCount).toBe(5);
    expect(data.completedLines).toBe(1);
  });

  it("calculates completedLines correctly for a completed column", async () => {
    await seedTestUser(TEST_USER_ID);
    setMockUser(TEST_USER_ID);

    const weekStartDate = getCurrentWeekMonday();
    const card = await seedBingoCard({
      theme: "Column Completion",
      weekStartDate,
    });
    const tasks = await seedBingoTasks(card.id, 25);

    const place = await seedPlace({ name: "Column Place" });
    const checkIn = await seedCheckIn(TEST_USER_ID, place.id);

    // Complete first column: indices 0, 5, 10, 15, 20
    for (let i = 0; i < 5; i++) {
      await seedBingoCompletion(TEST_USER_ID, tasks[i * 5].id, checkIn.id);
    }

    const response = await GET();
    const { status, data } = await parseResponse<{
      completedCount: number;
      completedLines: number;
    }>(response);

    expect(status).toBe(200);
    expect(data.completedCount).toBe(5);
    expect(data.completedLines).toBe(1);
  });

  it("calculates completedLines correctly for a completed diagonal", async () => {
    await seedTestUser(TEST_USER_ID);
    setMockUser(TEST_USER_ID);

    const weekStartDate = getCurrentWeekMonday();
    const card = await seedBingoCard({
      theme: "Diagonal Completion",
      weekStartDate,
    });
    const tasks = await seedBingoTasks(card.id, 25);

    const place = await seedPlace({ name: "Diagonal Place" });
    const checkIn = await seedCheckIn(TEST_USER_ID, place.id);

    // Complete top-left to bottom-right diagonal: indices 0, 6, 12, 18, 24
    const diagonalIndices = [0, 6, 12, 18, 24];
    for (const idx of diagonalIndices) {
      await seedBingoCompletion(TEST_USER_ID, tasks[idx].id, checkIn.id);
    }

    const response = await GET();
    const { status, data } = await parseResponse<{
      completedCount: number;
      completedLines: number;
    }>(response);

    expect(status).toBe(200);
    expect(data.completedCount).toBe(5);
    expect(data.completedLines).toBe(1);
  });

  it("calculates completedLines correctly for multiple completed lines", async () => {
    await seedTestUser(TEST_USER_ID);
    setMockUser(TEST_USER_ID);

    const weekStartDate = getCurrentWeekMonday();
    const card = await seedBingoCard({
      theme: "Multi-Line Completion",
      weekStartDate,
    });
    const tasks = await seedBingoTasks(card.id, 25);

    const place = await seedPlace({ name: "Multi Place" });
    const checkIn = await seedCheckIn(TEST_USER_ID, place.id);

    // Complete first row (indices 0-4) and first column (indices 0, 5, 10, 15, 20)
    // Index 0 is shared, so total unique completions = 9
    const completionIndices = new Set([0, 1, 2, 3, 4, 5, 10, 15, 20]);
    for (const idx of completionIndices) {
      await seedBingoCompletion(TEST_USER_ID, tasks[idx].id, checkIn.id);
    }

    const response = await GET();
    const { status, data } = await parseResponse<{
      completedCount: number;
      completedLines: number;
    }>(response);

    expect(status).toBe(200);
    expect(data.completedCount).toBe(9);
    // First row + first column = 2 lines
    expect(data.completedLines).toBe(2);
  });

  it("does not return completions from another user", async () => {
    const otherUserId = "other-user-bingo";
    await seedTestUser(TEST_USER_ID);
    await seedTestUser(otherUserId, { email: "other@test.com" });
    setMockUser(TEST_USER_ID);

    const weekStartDate = getCurrentWeekMonday();
    const card = await seedBingoCard({
      theme: "Isolation Theme",
      weekStartDate,
    });
    const tasks = await seedBingoTasks(card.id, 25);

    const place = await seedPlace({ name: "Isolation Place" });
    const otherCheckIn = await seedCheckIn(otherUserId, place.id);

    // Other user completes a full row
    for (let i = 0; i < 5; i++) {
      await seedBingoCompletion(otherUserId, tasks[i].id, otherCheckIn.id);
    }

    const response = await GET();
    const { status, data } = await parseResponse<{
      card: { id: string };
      completions: unknown[];
      completedCount: number;
      completedLines: number;
    }>(response);

    expect(status).toBe(200);
    expect(data.card.id).toBe(card.id);
    // Current user has no completions
    expect(data.completions).toEqual([]);
    expect(data.completedCount).toBe(0);
    expect(data.completedLines).toBe(0);
  });
});
