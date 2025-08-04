// auth.ts (or wherever you configure NextAuth)
import NextAuth from "next-auth";
import GitHub from "next-auth/providers/github";
import { PrismaAdapter } from "@auth/prisma-adapter";
import prisma from "@/lib/prisma"; // Adjust path if needed

// Ensure environment variables are present
const githubId = process.env.AUTH_GITHUB_ID;
const githubSecret = process.env.AUTH_GITHUB_SECRET;
const authSecret = process.env.AUTH_SECRET;

if (!githubId) {
  throw new Error("Missing AUTH_GITHUB_ID environment variable");
}
if (!githubSecret) {
  throw new Error("Missing AUTH_GITHUB_SECRET environment variable");
}
if (!authSecret) {
  throw new Error("Missing AUTH_SECRET environment variable");
}

export const {
  handlers: { GET, POST },
  auth,
  signIn,
  signOut,
} = NextAuth({
  // Use the Prisma adapter for database interactions
  adapter: PrismaAdapter(prisma),
  // Configure the GitHub provider
  providers: [
    GitHub({
      clientId: githubId,
      clientSecret: githubSecret,
    }),
  ],
  // Explicitly use JWT strategy for sessions (can be helpful for debugging)
  session: {
    strategy: "jwt",
  },
  // Secret used to encrypt the NextAuth.js cookie
  secret: authSecret,
  // Trust the host header from Vercel/Cloudflare/etc.
  trustHost: true,
  // Remove ALL other options: callbacks, pages, events, etc. for minimal testing
  // Ensure AUTH_URL is set correctly in Vercel env vars for Production only
});
