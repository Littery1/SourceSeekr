// API route handler for NextAuth
export { GET, POST } from "@/auth";

// Force dynamic route handling to avoid caching issues
export const dynamic = "force-dynamic";