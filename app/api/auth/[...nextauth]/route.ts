import { handlers } from "@/auth";
export const { GET, POST } = handlers;

// This is crucial for Vercel Hobby plan to prevent timeouts
export const maxDuration = 60;

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
