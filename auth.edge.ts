/// <reference types="node" />

import NextAuth from "next-auth";
import GitHub from "next-auth/providers/github";
import { PrismaAdapter } from "@auth/prisma-adapter";
// Correctly import the default export from our edge client file
import prisma from "./prisma/edge";
import type { PrismaClient } from "@prisma/client";

// --- Environment Variable Validation ---
const GITHUB_CLIENT_ID = process.env.AUTH_GITHUB_ID;
const GITHUB_CLIENT_SECRET = process.env.AUTH_GITHUB_SECRET;
const AUTH_SECRET = process.env.AUTH_SECRET;

if (!GITHUB_CLIENT_ID || !GITHUB_CLIENT_SECRET || !AUTH_SECRET) {
  throw new Error("Missing environment variables for authentication");
}

export const { handlers, auth } = NextAuth({
  // Use a type assertion to satisfy the adapter's type requirement
  adapter: PrismaAdapter(prisma as unknown as PrismaClient),
  secret: AUTH_SECRET,
  providers: [
    GitHub({
      clientId: GITHUB_CLIENT_ID,
      clientSecret: GITHUB_CLIENT_SECRET,
    }),
  ],
});
