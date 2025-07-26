import { auth } from "./auth"
import { NextResponse } from "next/server"

export default auth((req) => {
  const isLoggedIn = !!req.auth;
  const { nextUrl } = req;

  // Define public routes that don't require authentication
  const publicRoutes = ["/", "/login", "/register", "/about", "/explore", "/auth-test"];
  
  // Define protected routes that require authentication
  const protectedRoutes = ["/dashboard", "/profile", "/saved", "/chat"];

  const isProtectedRoute = protectedRoutes.some(route => nextUrl.pathname.startsWith(route));

  if (isProtectedRoute && !isLoggedIn) {
    // Redirect unauthenticated users trying to access protected routes to the login page
    let callbackUrl = nextUrl.pathname;
    if (nextUrl.search) {
      callbackUrl += nextUrl.search;
    }
    
    const encodedCallbackUrl = encodeURIComponent(callbackUrl);
    return NextResponse.redirect(new URL(`/login?callbackUrl=${encodedCallbackUrl}`, req.url));
  }
  
  // If a logged-in user tries to visit the login page, redirect them to the dashboard
  if (isLoggedIn && (nextUrl.pathname === "/login" || nextUrl.pathname === "/register")) {
    return NextResponse.redirect(new URL("/dashboard", req.url));
  }

  // Allow the request to proceed
  return NextResponse.next();
})

// Configure middleware matcher to run on all paths except for API routes and static files
export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico|images|.*\..*).*)',
  ],
};