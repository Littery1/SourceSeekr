// app/api/auth/[...nextauth]/route.ts
import { handlers } from "@/auth";
export const { GET, POST } = handlers;

// Force dynamic route handling to avoid caching issues
export const dynamic = "force-dynamic";
