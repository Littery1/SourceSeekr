import { auth, signOut } from "@/auth";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const session = await auth();
  const callbackUrl = request.nextUrl.searchParams.get("callbackUrl") || "/";
  
  try {
    if (session) {
      // Explicitly call signOut to clear session
      await signOut({ redirectTo: callbackUrl });
    }
    
    // Create a response with cleared cookies
    const response = NextResponse.json({ success: true, message: "Signed out successfully" });
    
    // Set cookie expiration in the past to ensure they're removed
    response.cookies.set("next-auth.session-token", "", { 
      expires: new Date(0),
      path: "/"
    });
    
    response.cookies.set("next-auth.csrf-token", "", {
      expires: new Date(0),
      path: "/"
    });
    
    response.cookies.set("next-auth.callback-url", "", {
      expires: new Date(0),
      path: "/"
    });
    
    // Add cache control headers to prevent caching
    response.headers.set("Cache-Control", "no-store, max-age=0");
    
    return response;
  } catch (error) {
    console.error("Error during sign out:", error);
    return NextResponse.json({ success: false, message: "Error signing out" }, { status: 500 });
  }
}