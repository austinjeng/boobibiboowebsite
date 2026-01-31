import { describe, it, expect, beforeAll, afterEach, afterAll } from "vitest";
import { setupAuthMock, setMockUser } from "../../helpers/auth-mock";
import { setupDbMock } from "../../helpers/db-mock";
import {
  setupTestDatabase,
  cleanDatabase,
  teardownTestDatabase,
} from "../../setup-db";
import { createTestRequest, parseResponse } from "../../helpers/api-helpers";
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
import { POST } from "@/app/api/bingo/complete/route";

const TEST_USER_ID = "test-user-bingo-complete";
const OTHER_USER_ID = "other-user-bingo-complete";

describe("POST /api/bingo/complete", () => {
  let bingoCard: { id: string };
  let bingoTasks: { id: string }[];
  let place: { id: string };
  let checkIn: { id: string };

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

  /** Helper to seed common data needed by most tests */
  async function seedCommonData() {
    await seedTestUser(TEST_USER_ID);
    bingoCard = await seedBingoCard();
    bingoTasks = await seedBingoTasks(bingoCard.id, 5);
    place = await seedPlace();
    checkIn = await seedCheckIn(TEST_USER_ID, place.id);
  }

  it("returns 401 when not authenticated", async () => {
    setMockUser(null);

    const request = createTestRequest("/api/bingo/complete", {
      method: "POST",
      body: { taskId: "some-task-id", checkInId: "some-checkin-id" },
    });

    const response = await POST(request);
    const { status, data } = await parseResponse<{ error: string }>(response);

    expect(status).toBe(401);
    expect(data.error).toBe("Unauthorized");
  });

  it("returns 400 when taskId is missing", async () => {
    await seedCommonData();
    setMockUser(TEST_USER_ID);

    const request = createTestRequest("/api/bingo/complete", {
      method: "POST",
      body: { checkInId: checkIn.id },
    });

    const response = await POST(request);
    const { status, data } = await parseResponse<{ error: string }>(response);

    expect(status).toBe(400);
    expect(data.error).toBe("taskId and checkInId are required");
  });

  it("returns 400 when checkInId is missing", async () => {
    await seedCommonData();
    setMockUser(TEST_USER_ID);

    const request = createTestRequest("/api/bingo/complete", {
      method: "POST",
      body: { taskId: bingoTasks[0].id },
    });

    const response = await POST(request);
    const { status, data } = await parseResponse<{ error: string }>(response);

    expect(status).toBe(400);
    expect(data.error).toBe("taskId and checkInId are required");
  });

  it("returns 404 when task does not exist", async () => {
    await seedCommonData();
    setMockUser(TEST_USER_ID);

    const request = createTestRequest("/api/bingo/complete", {
      method: "POST",
      body: {
        taskId: "00000000-0000-0000-0000-000000000000",
        checkInId: checkIn.id,
      },
    });

    const response = await POST(request);
    const { status, data } = await parseResponse<{ error: string }>(response);

    expect(status).toBe(404);
    expect(data.error).toBe("Task not found");
  });

  it("returns 404 when check-in does not exist", async () => {
    await seedCommonData();
    setMockUser(TEST_USER_ID);

    const request = createTestRequest("/api/bingo/complete", {
      method: "POST",
      body: {
        taskId: bingoTasks[0].id,
        checkInId: "00000000-0000-0000-0000-000000000000",
      },
    });

    const response = await POST(request);
    const { status, data } = await parseResponse<{ error: string }>(response);

    expect(status).toBe(404);
    expect(data.error).toBe("Check-in not found");
  });

  it("returns 404 when check-in belongs to another user", async () => {
    await seedCommonData();
    await seedTestUser(OTHER_USER_ID, { name: "Other User", email: "other@test.com" });
    const otherCheckIn = await seedCheckIn(OTHER_USER_ID, place.id);

    setMockUser(TEST_USER_ID);

    const request = createTestRequest("/api/bingo/complete", {
      method: "POST",
      body: {
        taskId: bingoTasks[0].id,
        checkInId: otherCheckIn.id,
      },
    });

    const response = await POST(request);
    const { status, data } = await parseResponse<{ error: string }>(response);

    expect(status).toBe(404);
    expect(data.error).toBe("Check-in not found");
  });

  it("returns 409 when task is already completed", async () => {
    await seedCommonData();
    setMockUser(TEST_USER_ID);

    // Seed an existing completion for this user + task
    await seedBingoCompletion(TEST_USER_ID, bingoTasks[0].id, checkIn.id);

    const request = createTestRequest("/api/bingo/complete", {
      method: "POST",
      body: {
        taskId: bingoTasks[0].id,
        checkInId: checkIn.id,
      },
    });

    const response = await POST(request);
    const { status, data } = await parseResponse<{ error: string }>(response);

    expect(status).toBe(409);
    expect(data.error).toBe("Task already completed");
  });

  it("successfully completes a task (200 with success: true)", async () => {
    await seedCommonData();
    setMockUser(TEST_USER_ID);

    const request = createTestRequest("/api/bingo/complete", {
      method: "POST",
      body: {
        taskId: bingoTasks[0].id,
        checkInId: checkIn.id,
      },
    });

    const response = await POST(request);
    const { status, data } = await parseResponse<{
      success: boolean;
      completion: { id: string; completed_at: string };
    }>(response);

    expect(status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.completion).toBeDefined();
    expect(data.completion.id).toBeDefined();
    expect(data.completion.completed_at).toBeDefined();
  });
});
