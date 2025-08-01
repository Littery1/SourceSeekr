import { auth } from "./auth.edge";
import { NextResponse } from "next/server";

export default auth((req) => {
  const isLoggedIn = !!req.auth;
  const { nextUrl } = req;

  const isProtectedRoute = ["/dashboard", "/profile", "/saved", "/chat"].some(
    (path) => nextUrl.pathname.startsWith(path)
  );

  const isAuthRoute = [
    "/login",
    "/register", // Add any other auth routes here
  ].some((path) => nextUrl.pathname.startsWith(path));

  // Case 1: Trying to access a protected route without being logged in
  if (isProtectedRoute && !isLoggedIn) {
    // Redirect to login, preserving the intended destination
    const loginUrl = new URL("/login", nextUrl.origin);
    loginUrl.searchParams.set("callbackUrl", nextUrl.href); // Use full href
    return NextResponse.redirect(loginUrl);
  }

  // Case 2: Already logged in, but trying to access an auth page (like /login)
  if (isAuthRoute && isLoggedIn) {
    // Redirect to the dashboard
    return NextResponse.redirect(new URL("/dashboard", nextUrl.origin));
  }

  // Case 3: All other cases, allow the request to proceed
  return NextResponse.next();
});

// This config remains the same
export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|images).*)"],
};
