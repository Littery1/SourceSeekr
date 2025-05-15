import { auth, signOut } from "@/auth";
import { NextRequest, NextResponse } from "next/server";

// Helper function to handle signout logic for both GET and POST
async function handleSignOut(request: NextRequest) {
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
    const cookiesToClear = [
      "next-auth.session-token",
      "__Secure-next-auth.session-token",
      "__Host-next-auth.session-token",
      "next-auth.csrf-token",
      "__Secure-next-auth.csrf-token",
      "__Host-next-auth.csrf-token",
      "next-auth.callback-url",
      "__Secure-next-auth.callback-url",
      "__Host-next-auth.callback-url"
    ];
    
    cookiesToClear.forEach(name => {
      response.cookies.set(name, "", { 
        expires: new Date(0),
        path: "/"
      });
    });
    
    // Add cache control headers to prevent caching
    response.headers.set("Cache-Control", "no-store, max-age=0");
    response.headers.set("Pragma", "no-cache");
    response.headers.set("Expires", "0");
    
    return response;
  } catch (error) {
    console.error("Error during sign out:", error);
    return NextResponse.json({ success: false, message: "Error signing out" }, { status: 500 });
  }
}

// GET handler for signout
export async function GET(request: NextRequest) {
  return handleSignOut(request);
}

// POST handler for signout - this is what the client-side signOut() function calls
export async function POST(request: NextRequest) {
  return handleSignOut(request);
}