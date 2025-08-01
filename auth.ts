// auth.ts

import NextAuth from "next-auth";
import GitHub from "next-auth/providers/github";
import { PrismaAdapter } from "@auth/prisma-adapter";
import prisma from "./prisma/prisma";

const GITHUB_CLIENT_ID = process.env.AUTH_GITHUB_ID;
const GITHUB_CLIENT_SECRET = process.env.AUTH_GITHUB_SECRET;
const AUTH_SECRET = process.env.AUTH_SECRET;

// Define the application's base URL from the new environment variable
const APP_URL = process.env.NEXT_PUBLIC_APP_URL;

if (!GITHUB_CLIENT_ID || !GITHUB_CLIENT_SECRET) {
  throw new Error(
    "Missing GitHub OAuth credentials (AUTH_GITHUB_ID or AUTH_GITHUB_SECRET)"
  );
}

if (!AUTH_SECRET) {
  throw new Error("Missing AUTH_SECRET environment variable");
}

if (!APP_URL) {
  // This will cause the build to fail if the variable is missing, which is good.
  throw new Error("Missing NEXT_PUBLIC_APP_URL environment variable");
}

export const { handlers, signIn, signOut, auth } = NextAuth({
  adapter: PrismaAdapter(prisma),
  // By setting a base path, we provide a stable URL for all auth operations,
  // preventing reliance on dynamic headers or Vercel's runtime variables.
  basePath: "/api/auth",
  providers: [
    GitHub({
      clientId: GITHUB_CLIENT_ID,
      clientSecret: GITHUB_CLIENT_SECRET,
      authorization: {
        params: {
          scope: "read:user user:email public_repo",
        },
      },
    }),
  ],
  session: {
    strategy: "database",
  },
  callbacks: {
    async signIn({ user, account, profile }) {
      if (account && account.provider === "github") {
        console.log("--- GitHub Sign-In Data Received ---");
        console.log("User Object:", user);
        console.log("Account Object (contains tokens):", account);
        console.log("------------------------------------");
      }
      return true;
    },
    async session({ session, user }) {
      if (session.user && user) {
        session.user.id = user.id;
      }
      return session;
    },
  },
  pages: {
    signIn: "/login",
  },
  secret: AUTH_SECRET,
  // trustHost is still good practice.
  trustHost: true,
});
