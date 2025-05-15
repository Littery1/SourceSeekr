import { auth, signOut } from "@/auth";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    // Get the active session if any
    const session = await auth();
    const requestId = Math.random().toString(36).substring(2, 10); // For correlating log messages
    console.log(`[${requestId}] GitHub logout route called, active session:`, !!session);
    
    // Get the callback URL from query parameters (default to login page)
    let callbackUrl = request.nextUrl.searchParams.get("callbackUrl") || "/login";
    
    // Ensure the callback URL doesn't already have a timestamp to avoid parameter duplication
    if (callbackUrl.includes('t=')) {
      const url = new URL(callbackUrl, request.nextUrl.origin);
      url.searchParams.delete('t');
      callbackUrl = url.pathname + url.search;
    }
    
    // Generate a unique parameter to prevent caching issues
    const timestamp = Date.now();
    
    // Build the return URL with timestamp to prevent caching
    const returnUrl = new URL(callbackUrl, request.nextUrl.origin);
    returnUrl.searchParams.append("t", timestamp.toString());
    
    // Also add a logout_success parameter to help diagnose flow issues
    returnUrl.searchParams.append("logout", "success");
    
    // Log the full flow for debugging
    console.log(`[${requestId}] GitHub logout flow:`);
    console.log(`[${requestId}] - Session exists:`, !!session);
    console.log(`[${requestId}] - Return URL:`, returnUrl.toString());
    
    // Clear server-side session data
    console.log(`[${requestId}] - Attempting to clear server-side session`);
    await signOut({ redirect: false });
    console.log(`[${requestId}] - Server-side signOut complete`);
    
    // Create a response that redirects to the return URL
    const response = NextResponse.redirect(returnUrl, { status: 302 });
    
    // Add aggressive cache-busting and cookie-clearing headers
    response.headers.set("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
    response.headers.set("Pragma", "no-cache");
    response.headers.set("Expires", "0");
    response.headers.set("Surrogate-Control", "no-store");
    
    // This header tells browsers to clear cookies, cache, and storage for this site
    // It's the most aggressive way to ensure all session data is removed
    response.headers.set("Clear-Site-Data", "\"cache\", \"cookies\", \"storage\"");
    
    // Also attempt to manually unset cookies in the response
    const cookieNames = [
      'next-auth.session-token',
      '__Secure-next-auth.session-token',
      '__Host-next-auth.session-token',
      'next-auth.csrf-token',
      '__Secure-next-auth.csrf-token',
      '__Host-next-auth.callback-url',
      '__Secure-next-auth.callback-url'
    ];
    
    // Set each cookie to expired in the response
    cookieNames.forEach(name => {
      response.cookies.set({
        name,
        value: '',
        expires: new Date(0),
        path: '/',
      });
      
      // Also try with the secure attribute
      response.cookies.set({
        name: name,
        value: '',
        expires: new Date(0),
        path: '/',
        secure: true,
        sameSite: 'lax'
      });
    });
    
    console.log(`[${requestId}] - Returning with cache-busting headers and expired cookies`);
    return response;
  } catch (error) {
    console.error("Critical error during GitHub logout:", error);
    // In case of error, redirect to the home page with error indication
    const errorUrl = new URL('/login', request.url);
    errorUrl.searchParams.set("error", "logout_failed");
    errorUrl.searchParams.set("t", Date.now().toString());
    return NextResponse.redirect(errorUrl);
  }
}