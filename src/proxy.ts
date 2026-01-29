import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";

// Protected routes that require authentication
const protectedRoutes = [
  "/checkin",
  "/profile",
  "/room",
];

// Auth routes that should redirect to home if already authenticated
const authRoutes = ["/auth/sign-in", "/auth/sign-up"];

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Check if the route is protected
  const isProtectedRoute = protectedRoutes.some((route) =>
    pathname.startsWith(route)
  );

  // Check if the route is an auth route
  const isAuthRoute = authRoutes.some((route) => pathname.startsWith(route));

  if (isProtectedRoute || isAuthRoute) {
    // Get session from BetterAuth
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    // Redirect unauthenticated users from protected routes to sign-in
    if (isProtectedRoute && !session) {
      const signInUrl = new URL("/auth/sign-in", request.url);
      signInUrl.searchParams.set("callbackUrl", pathname);
      return NextResponse.redirect(signInUrl);
    }

    // Redirect authenticated users from auth routes to home
    if (isAuthRoute && session) {
      return NextResponse.redirect(new URL("/", request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - api/auth (auth API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    "/((?!api/auth|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
