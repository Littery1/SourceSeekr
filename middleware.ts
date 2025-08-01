import { NextResponse } from "next/server";
import { auth } from "@/auth"; // Assuming auth is configured for JWT

const protectedRoutes = ["/dashboard", "/profile", "/saved", "/chat"];
const authRoutes = ["/login", "/register"];

export default auth((req) => {
  const { pathname } = req.nextUrl;
  const isLoggedIn = !!req.auth;

  const isProtectedRoute = protectedRoutes.some((path) =>
    pathname.startsWith(path)
  );
  const isAuthRoute = authRoutes.some((path) => pathname.startsWith(path));

  if (isProtectedRoute && !isLoggedIn) {
    const loginUrl = new URL("/login", req.url);
    loginUrl.searchParams.set("callbackUrl", req.nextUrl.href);
    return NextResponse.redirect(loginUrl);
  }

  if (isAuthRoute && isLoggedIn) {
    return NextResponse.redirect(new URL("/dashboard", req.url));
  }

  return NextResponse.next();
});

// This config prevents the middleware from running on static files and API routes
// It's crucial to exclude the /api/auth routes from the middleware to prevent conflicts.
export const config = {
  matcher: ["/((?!api/auth|_next/static|_next/image|favicon.ico|images).*)"],
};
