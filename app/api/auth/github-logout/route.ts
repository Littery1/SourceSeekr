import { auth, signOut } from "@/auth";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    // Get the active session if any
    const session = await auth();
    console.log("GitHub logout route called, active session:", !!session);
    
    // Get the callback URL from query parameters (default to login page)
    const callbackUrl = request.nextUrl.searchParams.get("callbackUrl") || "/login";
    
    // Generate a unique parameter to prevent caching issues
    const timestamp = Date.now();
    
    // Build the return URL with timestamp to prevent caching
    const returnUrl = new URL(callbackUrl, request.nextUrl.origin);
    returnUrl.searchParams.append("t", timestamp.toString());
    
    // Log the full flow for debugging
    console.log("GitHub logout flow:");
    console.log("- Session exists:", !!session);
    console.log("- Return URL:", returnUrl.toString());
    
    // Clear server-side session data
    if (session) {
      console.log("- Clearing server-side session");
      await signOut({ redirect: false });
    }
    
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
    
    console.log("- Returning with cache-busting headers");
    return response;
  } catch (error) {
    console.error("Critical error during GitHub logout:", error);
    // In case of error, redirect to the home page with error indication
    const errorUrl = new URL('/login', request.url);
    errorUrl.searchParams.set("error", "logout_failed");
    return NextResponse.redirect(errorUrl);
  }
}