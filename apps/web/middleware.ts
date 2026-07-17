import { NextResponse } from "next/server";

import type { NextRequest } from "next/server";

const SESSION_COOKIE_NAME = "sora_session";

// Paths that require authentication
const PROTECTED_PATHS = [
  "/dashboard",
  "/assets",
  "/api-keys",
  "/activity-log",
  "/ownership-registry",
  "/settings",
  "/documents",
];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Check if the path is protected
  const isProtected = PROTECTED_PATHS.some((path) => pathname.startsWith(path));

  if (isProtected) {
    const sessionCookie = request.cookies.get(SESSION_COOKIE_NAME);

    // If no session cookie exists, redirect to login
    if (!sessionCookie || !sessionCookie.value) {
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("redirect", pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|.*\\.png$).*)"],
};
