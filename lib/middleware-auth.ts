/**
 * This file provides auth utilities for the middleware
 * that don't rely on Prisma directly, avoiding Edge Runtime restrictions
 */

export function checkAuthFromCookies(cookies: { get: (name: string) => { value?: string } | undefined }): boolean {
  // Check for authentication cookie - add all possible cookie names
  const authCookie = 
    cookies.get('next-auth.session-token')?.value || 
    cookies.get('__Secure-next-auth.session-token')?.value ||
    cookies.get('__Host-next-auth.session-token')?.value ||
    cookies.get('next-auth.session-token.0')?.value ||
    cookies.get('__Secure-next-auth.session-token.0')?.value;
  
  // Log cookie detection for debugging
  if (process.env.NODE_ENV === 'development') {
    console.log('Auth cookie detected:', !!authCookie);
  }
  
  return !!authCookie;
}