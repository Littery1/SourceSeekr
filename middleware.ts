import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { checkAuthFromCookies } from './lib/middleware-auth';

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
  
  // Skip middleware for auth-related API routes
  // This is critical to ensure OAuth callbacks work properly
  if (authPaths.some(path => pathname.startsWith(path))) {
    return NextResponse.next();
  }
  
  // For auth-test page used for debugging, allow access regardless of auth status
  if (pathname.startsWith('/auth-test')) {
    return NextResponse.next();
  }
  
  // Check authentication status from cookies
  const isAuthenticated = checkAuthFromCookies(request.cookies);
  
  // Check if the current path is protected
  const isProtectedPath = protectedPaths.some(path => pathname.startsWith(path));
  
  // Check if the current path is the login page
  const isLoginPage = pathname === '/login';
  
  // If the path is protected and the user is not authenticated, redirect to login
  if (isProtectedPath && !isAuthenticated) {
    const url = new URL('/login', request.url);
    url.searchParams.set('callbackUrl', encodeURI(pathname));
    return NextResponse.redirect(url);
  }
  
  // If user is already authenticated and trying to access login page, redirect them to dashboard
  if (isLoginPage && isAuthenticated) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }
  
  // Otherwise, continue with the request
  return NextResponse.next();
}

export const config = {
  matcher: [
    // Match all paths except static assets, images, and API routes
    '/((?!_next/static|_next/image|favicon.ico|images|fonts).*)',
  ],
};