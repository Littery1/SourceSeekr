// app/api/auth/[...nextauth]/route.ts
import { GET, POST } from "@/auth"; // Import the handlers directly

// Re-export them for the Next.js route
export { GET, POST };

// Vercel Route Segment Config (keep these if you had them)
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;
