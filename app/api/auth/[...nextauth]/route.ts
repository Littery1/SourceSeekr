// app/api/auth/[...nextauth]/route.ts
import { GET, POST } from "@/auth"; // Import from your root auth.ts

// Re-export for Next.js App Router
export { GET, POST };

// Vercel configuration (keep if you had these)
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;
