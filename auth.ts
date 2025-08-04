// auth.ts (in your project root)
import NextAuth from "next-auth";
import GitHub from "next-auth/providers/github";
import { PrismaAdapter } from "@auth/prisma-adapter";
import prisma from "@/lib/prisma";

// Environment variable validation (good practice)
if (!process.env.AUTH_GITHUB_ID) {
  throw new Error("Missing AUTH_GITHUB_ID environment variable");
}

if (!process.env.AUTH_GITHUB_SECRET) {
  throw new Error("Missing AUTH_GITHUB_SECRET environment variable");
}

if (!process.env.AUTH_SECRET) {
  throw new Error("Missing AUTH_SECRET environment variable");
}

// Correct NextAuth v5 Beta configuration and export
export const {
  handlers: { GET, POST },
  auth,
  signIn,
  signOut,
} = NextAuth({
  adapter: PrismaAdapter(prisma),
  providers: [
    GitHub({
      clientId: process.env.AUTH_GITHUB_ID,
      clientSecret: process.env.AUTH_GITHUB_SECRET,
    }),
  ],
  secret: process.env.AUTH_SECRET,
  // Add any other options you had before
  // callbacks: { ... }
});
