/**
 * This file provides auth utilities for the middleware
 * that don't rely on Prisma directly, avoiding Edge Runtime restrictions
 */

export function checkAuthFromCookies(cookies: { get: (name: string) => { value?: string } | undefined }): boolean {
  // Check for authentication cookie
  const authCookie = cookies.get('next-auth.session-token')?.value || 
                    cookies.get('__Secure-next-auth.session-token')?.value;
  
  return !!authCookie;
}