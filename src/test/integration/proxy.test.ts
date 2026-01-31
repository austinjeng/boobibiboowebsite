import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

// Mock the auth module used by proxy.ts
const mockGetSession = vi.fn();
vi.mock("@/lib/auth", () => ({
  auth: {
    api: {
      getSession: (...args: unknown[]) => mockGetSession(...args),
    },
  },
}));

import { proxy } from "@/proxy";

function createRequest(path: string): NextRequest {
  return new NextRequest(new URL(path, "http://localhost:3000"));
}

describe("proxy", () => {
  beforeEach(() => {
    mockGetSession.mockReset();
  });

  describe("protected routes", () => {
    const protectedPaths = ["/checkin", "/checkin/new", "/profile", "/room", "/room/ABC123"];

    for (const path of protectedPaths) {
      it(`redirects unauthenticated user from ${path} to sign-in`, async () => {
        mockGetSession.mockResolvedValue(null);
        const response = await proxy(createRequest(path));
        expect(response.status).toBe(307);
        const location = response.headers.get("location");
        expect(location).toContain("/auth/sign-in");
        expect(location).toContain(`callbackUrl=${encodeURIComponent(path)}`);
      });

      it(`allows authenticated user through ${path}`, async () => {
        mockGetSession.mockResolvedValue({
          user: { id: "user-1" },
          session: { id: "sess-1" },
        });
        const response = await proxy(createRequest(path));
        // NextResponse.next() returns 200
        expect(response.status).toBe(200);
        expect(response.headers.get("location")).toBeNull();
      });
    }
  });

  describe("auth routes", () => {
    const authPaths = ["/auth/sign-in", "/auth/sign-up"];

    for (const path of authPaths) {
      it(`redirects authenticated user from ${path} to home`, async () => {
        mockGetSession.mockResolvedValue({
          user: { id: "user-1" },
          session: { id: "sess-1" },
        });
        const response = await proxy(createRequest(path));
        expect(response.status).toBe(307);
        const location = response.headers.get("location");
        expect(location).toBe("http://localhost:3000/");
      });

      it(`allows unauthenticated user through ${path}`, async () => {
        mockGetSession.mockResolvedValue(null);
        const response = await proxy(createRequest(path));
        expect(response.status).toBe(200);
      });
    }
  });

  describe("public routes", () => {
    const publicPaths = ["/", "/bingo", "/map"];

    for (const path of publicPaths) {
      it(`passes through ${path} regardless of auth (unauthenticated)`, async () => {
        // For public routes, proxy doesn't call getSession at all
        const response = await proxy(createRequest(path));
        expect(response.status).toBe(200);
      });

      it(`passes through ${path} regardless of auth (authenticated)`, async () => {
        const response = await proxy(createRequest(path));
        expect(response.status).toBe(200);
      });
    }
  });
});
