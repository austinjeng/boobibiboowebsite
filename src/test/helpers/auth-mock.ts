import { vi } from "vitest";

let _mockUserId: string | null = null;

/**
 * Must be called BEFORE importing any route handlers.
 * Vitest hoists vi.mock calls to the top of the file.
 */
export function setupAuthMock() {
  vi.mock("@/lib/get-session", () => ({
    getSession: vi.fn(async () => {
      if (!_mockUserId) return null;
      return {
        user: { id: _mockUserId, name: "Test User", email: "test@example.com" },
        session: { id: "test-session-id" },
      };
    }),
    requireSession: vi.fn(async () => {
      if (!_mockUserId) throw new Error("Unauthorized");
      return {
        user: { id: _mockUserId, name: "Test User", email: "test@example.com" },
        session: { id: "test-session-id" },
      };
    }),
    getUserId: vi.fn(async () => _mockUserId),
    requireUserId: vi.fn(async () => {
      if (!_mockUserId) throw new Error("Unauthorized");
      return _mockUserId;
    }),
  }));
}

export function setMockUser(userId: string | null) {
  _mockUserId = userId;
}
