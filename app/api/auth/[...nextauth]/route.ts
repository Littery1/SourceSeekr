// app/api/auth/[...nextauth]/route.ts
import { handlers } from "@/auth";
export const { GET, POST } = handlers;

export const maxDuration = 60; // Increase the timeout to 60 seconds

// Force this route to use the Node.js runtime
export const dynamic = "force-dynamic";
export const runtime = "nodejs";