/**
 * This file provides auth utilities for the middleware
 * that don't rely on Prisma directly, avoiding Edge Runtime restrictions
 */

import { NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';

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
  try {
    // Use next-auth's getToken to validate the token
    const token = await getToken({ 
      req: request,
      secret: process.env.NEXTAUTH_SECRET
    });
    
    const isAuthenticated = !!token;
    
    // Log authentication status in development
    if (process.env.NODE_ENV === 'development') {
      console.log('JWT token verified, authenticated:', isAuthenticated);
    }
    
    return isAuthenticated;
  } catch (error) {
    console.error('Error verifying auth token:', error);
    
    // Fallback to basic cookie check if JWT verification fails
    return checkAuthFromCookies(request.cookies);
  }
}