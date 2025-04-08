import { auth, signOut } from "@/auth";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const session = await auth();
  const callbackUrl = request.nextUrl.searchParams.get("callbackUrl") || "/login";
  
  // Clear session cookies by signing out
  if (session) {
    await signOut({ redirectTo: callbackUrl });
  }
  
  // Force cookie removal
  const response = NextResponse.redirect(new URL(callbackUrl, request.url));
  
  // Add cache control headers to prevent caching
  response.headers.set("Cache-Control", "no-store, max-age=0");
  
  return response;
}