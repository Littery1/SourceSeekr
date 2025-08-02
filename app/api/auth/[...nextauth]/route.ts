import { handlers } from "@/auth";
export const { GET, POST } = handlers;

export const runtime = "nodejs"; // Force Node.js runtime for this route
export const maxDuration = 60; // Increase timeout for cold starts + DB operations
export const dynamic = "force-dynamic";
