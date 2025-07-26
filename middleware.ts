import { auth } from "./auth"

// The middleware is now just an export from the auth function.
// All logic for protecting routes will be handled by redirecting
// in server components or checking session status in client components.
export default auth;

// This config is crucial. It tells the middleware to run on ALMOST all paths,
// EXCEPT for specific ones that should always be public (like API routes, static files).
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
}