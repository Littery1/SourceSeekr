import NextAuth, {
  type Session,
  type Account,
  type Profile,
  type User,
} from "next-auth";
import GitHub from "next-auth/providers/github";
import { PrismaAdapter } from "@auth/prisma-adapter";
// CORRECTED: Use the standard Node.js Prisma client for API routes
import prisma from "./prisma/prisma";

// --- Environment Variable Validation ---
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

console.log("NextAuth (Node.js) initialization - Environment checks passed.");

export const { handlers, signIn, signOut, auth } = NextAuth({
  adapter: PrismaAdapter(prisma),
  providers: [
    GitHub({
      clientId: GITHUB_CLIENT_ID,
      clientSecret: GITHUB_CLIENT_SECRET,
      authorization: {
        params: {
          prompt: "consent",
        },
      },
      profile(profile) {
        return {
          id: profile.id.toString(),
          name: profile.name || profile.login,
          email: profile.email,
          image: profile.avatar_url,
        };
      },
    }),
  ],
  session: {
    strategy: "database",
    maxAge: 30 * 24 * 60 * 60, // 30 days
    updateAge: 24 * 60 * 60, // Update sessions every 24 hours
  },
  callbacks: {
    async session({ session, user }) {
      if (session.user && user) {
        session.user.id = user.id;
      }
      return session;
    },
    async signIn({ user, account }) {
      if (account?.provider === "github") {
        if (!user.email) {
          console.warn(
            "GitHub user email is null. Sign-in cannot proceed without an email."
          );
          return false;
        }
      }
      return true;
    },
    redirect({ url, baseUrl }) {
      if (url.startsWith("/")) return `${baseUrl}${url}`;
      else if (new URL(url).origin === baseUrl) return url;
      return baseUrl;
    },
  },
  events: {
    async createUser({ user }) {
      console.log(`New user created: ${user.id}, email: ${user.email}`);
    },
    async signIn({ user }) {
      console.log(`User signed in: ${user.id}`);
    },
    async signOut(message) {
      if ("session" in message && message.session) {
        console.log(
          `User signed out from session: ${message.session.sessionToken}`
        );
      }
    },
  },
  pages: {
    signIn: "/login",
    signOut: "/",
    error: "/login",
  },
  secret: AUTH_SECRET,
  debug: true,
});
