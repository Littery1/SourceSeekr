/// <reference types="node" />

import NextAuth from "next-auth";
import GitHub from "next-auth/providers/github";
import { PrismaAdapter } from "@auth/prisma-adapter";
// Corrected: Import the default export from our edge client file
import prisma from "./prisma/edge";

// --- Environment Variable Validation ---
const GITHUB_CLIENT_ID = process.env.AUTH_GITHUB_ID;
const GITHUB_CLIENT_SECRET = process.env.AUTH_GITHUB_SECRET;
const AUTH_SECRET = process.env.AUTH_SECRET;

if (!GITHUB_CLIENT_ID || !GITHUB_CLIENT_SECRET || !AUTH_SECRET) {
  throw new Error("Missing environment variables for authentication");
}

// We no longer need to validate DATABASE_EDGE_URL here, as prisma/edge.ts handles it.

export const { handlers, auth } = NextAuth({
  adapter: PrismaAdapter(prisma),
  secret: AUTH_SECRET,
  providers: [
    GitHub({
      clientId: GITHUB_CLIENT_ID,
      clientSecret: GITHUB_CLIENT_SECRET,
    }),
  ],
});
