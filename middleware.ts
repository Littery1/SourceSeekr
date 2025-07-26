import { auth } from "./auth";
import { NextResponse } from 'next/server';

export default auth((req) => {
  const isLoggedIn = !!req.auth;
  const { nextUrl } = req;

  // Define routes that require authentication
  const protectedRoutes = ['/dashboard', '/profile', '/saved', '/chat'];

  const isProtectedRoute = protectedRoutes.some(path => nextUrl.pathname.startsWith(path));

  if (isProtectedRoute && !isLoggedIn) {
    // Redirect unauthenticated users to the login page
    // Preserve the original URL they tried to access as a callbackUrl
    const loginUrl = new URL("/login", nextUrl.origin);
    loginUrl.searchParams.set("callbackUrl", nextUrl.pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
});

// This config ensures the middleware runs on all paths except for static assets and API routes.
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - images (public image files)
     */
    '/((?!api|_next/static|_next/image|favicon.ico|images).*)',
  ],
};