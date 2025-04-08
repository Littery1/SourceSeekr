import { auth } from "@/auth";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const session = await auth();
  const url = new URL(request.url);
  const callbackUrl = url.searchParams.get('callbackUrl') || undefined;

  if (!session?.user) {
    return new NextResponse(
      JSON.stringify({ 
        status: "unauthenticated", 
        message: "You are not logged in",
        redirectTo: callbackUrl ? `/login?callbackUrl=${encodeURIComponent(callbackUrl)}` : "/login"
      }),
      { status: 401 }
    );
  }

  // Extract relevant authentication info
  const authInfo = {
    authenticated: true,
    user: {
      id: session.user.id,
      name: session.user.name,
      email: session.user.email,
      image: session.user.image,
      provider: (session.user as any).provider || "unknown",
      githubUsername: (session.user as any).githubUsername || null
    },
    expires: session.expires,
  };

  return NextResponse.json(authInfo);
}
