import { NextRequest } from "next/server";

export function createTestRequest(
  url: string,
  options: {
    method?: string;
    body?: unknown;
    headers?: Record<string, string>;
  } = {}
): NextRequest {
  const { method = "GET", body, headers = {} } = options;
  const fullUrl = url.startsWith("http") ? url : `http://localhost:3000${url}`;

  const init: RequestInit = {
    method,
    headers: {
      "Content-Type": "application/json",
      ...headers,
    },
  };

  if (body && method !== "GET") {
    init.body = JSON.stringify(body);
  }

  return new NextRequest(fullUrl, init as NextRequest);
}

export async function parseResponse<T = unknown>(
  response: Response
): Promise<{ status: number; data: T }> {
  const status = response.status;
  const data = (await response.json()) as T;
  return { status, data };
}
