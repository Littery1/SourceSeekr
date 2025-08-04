// auth.ts

import NextAuth from "next-auth";
import type { NextAuthConfig } from "next-auth"; // Use the correct type for v5
import GitHub from "next-auth/providers/github";
import { PrismaAdapter } from "@auth/prisma-adapter";
import prisma from "@/lib/prisma";

// This block checks for environment variables at startup.
// If they are missing, the build will fail, which is good.
const GITHUB_CLIENT_ID = process.env.AUTH_GITHUB_ID;
const GITHUB_CLIENT_SECRET = process.env.AUTH_GITHUB_SECRET;
const AUTH_SECRET = process.env.AUTH_SECRET;

if (!GITHUB_CLIENT_ID || !GITHUB_CLIENT_SECRET || !AUTH_SECRET) {
  throw new Error("Missing required environment variables for authentication.");
}

// Define the configuration as a separate, typed object. This is the key fix.
export const authConfig = {
  adapter: PrismaAdapter(prisma),
  providers: [
    GitHub({
      clientId: GITHUB_CLIENT_ID, // TypeScript now knows this is a string
      clientSecret: GITHUB_CLIENT_SECRET, // TypeScript now knows this is a string
    }),
  ],
  session: {
    strategy: "database",
  },
  secret: AUTH_SECRET,
  trustHost: true,
  pages: {
    signIn: "/login",
  },
  callbacks: {
    async session({ session, user }) {
      if (session.user) {
        session.user.id = user.id;
      }
      return session;
    },
  },
} satisfies NextAuthConfig; // Using "satisfies" provides type-checking without changing the object's type

// Initialize and export NextAuth.js with the configuration.
export const { handlers, signIn, signOut, auth } = NextAuth(authConfig);
