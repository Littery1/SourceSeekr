/**
 * This file provides auth utilities for the middleware
 * that don't rely on Prisma directly, avoiding Edge Runtime restrictions
 */

import { NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { authOptions } from '@/auth';

/**
 * Checks if the user is authenticated based on cookies
 * More robust method that tries multiple approaches for compatibility
 * 
 * @param cookies Request cookies
 * @returns True if authenticated, false otherwise
 */
export function checkAuthFromCookies(cookies: { get: (name: string) => { value?: string } | undefined }): boolean {
  try {
    // Check for session token cookie - these are the standard NextAuth cookie names
    // Check in order of production vs development naming patterns
    const sessionCookies = [
      // Production cookies - with security prefixes
      '__Secure-next-auth.session-token',
      '__Host-next-auth.session-token',
      
      // Development cookies - without security prefixes
      'next-auth.session-token',
      
      // Legacy cookie names
      'next-auth.session-token.0',
      '__Secure-next-auth.session-token.0'
    ];
    
    // Check for any valid session cookie
    const hasAuthCookie = sessionCookies.some(cookieName => {
      const cookie = cookies.get(cookieName);
      return !!cookie?.value;
    });
    
    // Log cookie detection in development mode
    if (process.env.NODE_ENV === 'development') {
      console.log('Auth cookie detected:', hasAuthCookie);
    }
    
    return hasAuthCookie;
  } catch (error) {
    // Safety fallback - if there's any error, assume not authenticated
    console.error('Error checking auth cookies:', error);
    return false;
  }
}

/**
 * More robust auth check that verifies the JWT token
 * Use this in middleware instead of the simpler cookie check
 * 
 * @param request The NextRequest object
 * @returns Promise resolving to true if authenticated, false otherwise
 */
export async function verifyAuthToken(request: NextRequest): Promise<boolean> {
  const requestId = Math.random().toString(36).substring(2, 8); // For correlating log messages
  
  try {
    // Log the cookies for debugging
    console.log(`[${requestId}] Auth cookies present:`, {
      hasSessionToken: !!request.cookies.get('next-auth.session-token')?.value,
      hasSecureSessionToken: !!request.cookies.get('__Secure-next-auth.session-token')?.value,
      hasHostSessionToken: !!request.cookies.get('__Host-next-auth.session-token')?.value,
      hasCsrfToken: !!request.cookies.get('next-auth.csrf-token')?.value,
    });
    
    // Verify the NEXTAUTH_SECRET is available
    if (!process.env.NEXTAUTH_SECRET) {
      console.error(`[${requestId}] NEXTAUTH_SECRET is not defined in environment variables`);
    } else {
      console.log(`[${requestId}] NEXTAUTH_SECRET is available (length: ${process.env.NEXTAUTH_SECRET.length})`);
    }
    
    // Use next-auth's getToken to validate the token
    console.log(`[${requestId}] Attempting to validate JWT token with getToken...`);
    const token = await getToken({ 
      req: request,
      secret: authOptions.secret
    });
    
    console.log(`[${requestId}] Token verification result:`, {
      hasToken: !!token,
      tokenSubject: token?.sub ? `[FILTERED-${token.sub.substring(0, 2)}...]` : 'none',
      tokenExpiry: token?.exp ? new Date(token.exp * 1000).toISOString() : 'none',
      tokenIat: token?.iat ? new Date(token.iat * 1000).toISOString() : 'none',
    });
    
    const isAuthenticated = !!token;
    return isAuthenticated;
  } catch (error) {
    console.error(`[${requestId}] Error verifying auth token:`, error);
    
    // Fallback to basic cookie check if JWT verification fails
    console.log(`[${requestId}] Falling back to cookie-based auth check`);
    const cookieResult = checkAuthFromCookies(request.cookies);
    console.log(`[${requestId}] Cookie-based auth check result:`, cookieResult);
    return cookieResult;
  }
}