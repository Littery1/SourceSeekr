// app/api/auth/[...nextauth]/route.ts
import { handlers } from "@/auth";
export const { GET, POST } = handlers;

// Force this route to use the Node.js runtime
export const runtime = "nodejs";

// Force dynamic route handling to avoid caching issues
export const dynamic = "force-dynamic";
