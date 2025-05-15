import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { verifyAuthToken } from './lib/middleware-auth';

// This file runs in the Edge Runtime, so can't use Prisma directly

// List of paths that don't require authentication
const publicPaths = [
  '/',
  '/about',
  '/login',
  '/explore'
];

// List of paths that require authentication
const protectedPaths = [
  '/dashboard',
  '/profile',
  '/saved',
  '/chat',
  '/repository'
];

// Auth-related paths that should never be intercepted by middleware
const authPaths = [
  '/api/auth',
  '/api/session'
];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const requestId = Math.random().toString(36).substring(2, 8); // For correlating log messages
  
  console.log(`[${requestId}] Middleware processing: ${pathname}`);
  
  // Skip middleware for auth-related API routes
  // This is critical to ensure OAuth callbacks work properly
  if (authPaths.some(path => pathname.startsWith(path))) {
    console.log(`[${requestId}] Skipping auth path: ${pathname}`);
    return NextResponse.next();
  }
  
  // For auth-test page used for debugging, allow access regardless of auth status
  if (pathname.startsWith('/auth-test')) {
    console.log(`[${requestId}] Auth test page, skipping checks`);
    return NextResponse.next();
  }
  
  // Check if the current path is protected
  const isProtectedPath = protectedPaths.some(path => pathname.startsWith(path));
  
  // Check if the current path is the login page
  const isLoginPage = pathname === '/login';
  
  // Don't verify auth for public paths unless it's the login page
  // This improves performance by avoiding unnecessary token verification
  if (!isProtectedPath && !isLoginPage) {
    console.log(`[${requestId}] Public path, skipping auth check: ${pathname}`);
    return NextResponse.next();
  }
  
  // Use JWT verification for more secure auth checking
  console.log(`[${requestId}] Verifying authentication for: ${pathname}`);
  const isAuthenticated = await verifyAuthToken(request);
  console.log(`[${requestId}] Authentication result: ${isAuthenticated}`);
  
  // If the path is protected and the user is not authenticated, redirect to login
  if (isProtectedPath && !isAuthenticated) {
    console.log(`[${requestId}] Protected path, unauthenticated, redirecting to login`);
    const url = new URL('/login', request.url);
    url.searchParams.set('callbackUrl', encodeURI(pathname));
    
    // Add cache-busting parameter
    url.searchParams.set('t', Date.now().toString());
    
    return NextResponse.redirect(url);
  }
  
  // If user is already authenticated and trying to access login page, redirect them to dashboard
  if (isLoginPage && isAuthenticated) {
    console.log(`[${requestId}] Login page, authenticated, redirecting to dashboard`);
    const dashboardUrl = new URL('/dashboard', request.url);
    // Add cache-busting parameter
    dashboardUrl.searchParams.set('t', Date.now().toString());
    return NextResponse.redirect(dashboardUrl);
  }
  
  // Otherwise, continue with the request
  console.log(`[${requestId}] Continuing with request: ${pathname}`);
  return NextResponse.next();
}

export const config = {
  matcher: [
    // Match all paths except static assets, images, and API routes
    '/((?!_next/static|_next/image|favicon.ico|images|fonts).*)',
  ],
};