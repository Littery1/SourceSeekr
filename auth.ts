// auth.ts

import NextAuth from "next-auth";
import GitHub from "next-auth/providers/github";
import { PrismaAdapter } from "@auth/prisma-adapter";
import prisma from "./prisma/prisma";

const GITHUB_CLIENT_ID = process.env.AUTH_GITHUB_ID;
const GITHUB_CLIENT_SECRET = process.env.AUTH_GITHUB_SECRET;
const AUTH_SECRET = process.env.AUTH_SECRET;

if (!GITHUB_CLIENT_ID || !GITHUB_CLIENT_SECRET) {
  throw new Error(
    "Missing GitHub OAuth credentials (AUTH_GITHUB_ID or AUTH_GITHUB_SECRET)"
  );
}

if (!AUTH_SECRET) {
  throw new Error("Missing AUTH_SECRET environment variable");
}

// We no longer need to check for AUTH_URL here, as NextAuth defaults well.

export const { handlers, signIn, signOut, auth } = NextAuth({
  adapter: PrismaAdapter(prisma),
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
  // By explicitly setting trustHost, we avoid reliance on Vercel's build-time variables.
  // NEXTAUTH_URL will be used instead, which you have correctly set in Vercel's dashboard.
  trustHost: true,
});
