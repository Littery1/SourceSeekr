import { auth, signOut } from "@/auth";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const session = await auth();
  const callbackUrl = request.nextUrl.searchParams.get("callbackUrl") || "/";
  
  try {
    // Generate a unique parameter to prevent caching issues
    const timestamp = Date.now();
    
    // Clear local session first
    if (session) {
      await signOut({ redirect: false });
    }
    
    // Instead of redirecting to GitHub's logout URL, redirect directly to our app
    const appUrl = new URL(callbackUrl, request.nextUrl.origin);
    appUrl.searchParams.append("t", timestamp.toString());
    
    // Create a response that redirects directly to our app
    const response = NextResponse.redirect(appUrl, { status: 302 });
    
    // Add cache control headers to prevent caching
    response.headers.set("Cache-Control", "no-store, max-age=0");
    response.headers.set("Clear-Site-Data", "\"cache\", \"cookies\", \"storage\"");
    
    return response;
  } catch (error) {
    console.error("Error during GitHub logout:", error);
    // In case of error, redirect to the login page
    return NextResponse.redirect(new URL('/', request.url));
  }
}