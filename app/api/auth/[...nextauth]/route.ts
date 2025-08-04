// app/api/auth/[...nextauth]/route.ts
import { GET, POST } from "@/auth";

console.log("✅ NextAuth route handler loaded");

export { GET, POST };

// Vercel configuration
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;
