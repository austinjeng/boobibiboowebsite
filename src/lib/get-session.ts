import { headers } from "next/headers";
import { auth, type Session } from "./auth";

// Server-side session validation helper
export async function getSession(): Promise<Session | null> {
  const session = await auth.api.getSession({
    headers: await headers(),
  });
  return session;
}

// Helper to require authentication - throws if not authenticated
export async function requireSession(): Promise<Session> {
  const session = await getSession();
  if (!session) {
    throw new Error("Unauthorized");
  }
  return session;
}

// Helper to get user ID or null
export async function getUserId(): Promise<string | null> {
  const session = await getSession();
  return session?.user?.id ?? null;
}

// Helper to require user ID - throws if not authenticated
export async function requireUserId(): Promise<string> {
  const session = await requireSession();
  return session.user.id;
}
