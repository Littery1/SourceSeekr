// app/api/auth/[...nextauth]/route.ts
import NextAuth from "next-auth";
import { handlers } from "@/auth"; // Adjusted path based on your structure

// Explicitly export the handlers - this is the correct pattern for v5 Beta
export const { GET, POST } = handlers;

// Vercel Route Segment Config
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;
