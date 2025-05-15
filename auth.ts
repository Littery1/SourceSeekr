import NextAuth from "next-auth";
import GitHub from "next-auth/providers/github";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { PrismaClient } from "@prisma/client";
import { prisma } from "./prisma/prisma";

// Enable verbose debugging (will appear in Vercel logs)
console.log("NextAuth initialization - Environment:");
console.log("- NODE_ENV:", process.env.NODE_ENV);
console.log("- NEXTAUTH_URL:", process.env.NEXTAUTH_URL);
console.log("- AUTH_URL:", process.env.AUTH_URL);
console.log("- NEXTAUTH_SECRET exists:", !!process.env.NEXTAUTH_SECRET);
console.log("- AUTH_SECRET exists:", !!process.env.AUTH_SECRET);
console.log("- GitHub ID exists:", !!(process.env.AUTH_GITHUB_ID || process.env.GITHUB_ID));
console.log("- GitHub Secret exists:", !!(process.env.AUTH_GITHUB_SECRET || process.env.GITHUB_SECRET));

export const { handlers, signIn, signOut, auth } = NextAuth({
  adapter: PrismaAdapter(prisma),
  providers: [
    GitHub({
      clientId: process.env.AUTH_GITHUB_ID || process.env.GITHUB_ID || "",
      clientSecret: process.env.AUTH_GITHUB_SECRET || process.env.GITHUB_SECRET || "",
      // Force GitHub to always show the authorization dialog for "login with different account"
      authorization: {
        params: {
          prompt: "consent", // Forces GitHub to show the authorization screen every time
        },
      },
      profile(profile) {
        try {
          console.log("GitHub profile data received:", {
            id: profile.id,
            login: profile.login,
            name: profile.name,
            email: !!profile.email, // Just log whether email exists
          });
          
          return {
            id: profile.id.toString(),
            name: profile.name || profile.login,
            email: profile.email,
            image: profile.avatar_url,
          };
        } catch (error) {
          console.error("Error in GitHub profile processing:", error);
          // Return basic profile to avoid breaking the flow
          return {
            id: profile.id.toString(),
            name: profile.login || "GitHub User",
            email: null,
            image: null,
          };
        }
      },
    }),
  ],
  session: {
    strategy: "database", // Store sessions in database for persistence
    maxAge: 30 * 24 * 60 * 60, // 30 days
    updateAge: 24 * 60 * 60, // Update sessions every 24 hours
  },
  callbacks: {
    async session({ session, user }) {
      console.log("Session Callback - creating session with user ID");
      
      // Add the user ID to the session
      if (session.user) {
        session.user.id = user.id;
      }
      
      return session;
    },
    async signIn({ user, account, profile }) {
      console.log("SignIn Callback - processing GitHub login");
      
      if (account?.provider === "github") {
        const existingUser = await prisma.user.findUnique({
          where: { email: user.email! },
        });

        if (!existingUser) {
          console.log(`New user signing in via GitHub: ${user.email}`);
          // Prisma adapter will handle creating the new user
        } else {
          console.log(`Existing user signing in via GitHub: ${user.email}`);
        }
      }
      
      return true; // Allow the sign in
    },
    // Redirect logic for signin/signout
    redirect({ url, baseUrl }) {
      console.log("Redirect Callback - handling redirect", { url, baseUrl });
      
      // If the URL starts with the base URL or is a relative URL, allow it
      if (url.startsWith("/")) return `${baseUrl}${url}`;
      else if (new URL(url).origin === baseUrl) return url;
      
      // Otherwise redirect to the base URL
      return baseUrl;
    }
  },
  events: {
    async createUser({ user }) {
      console.log(`New user created: ${user.id}, email: ${user.email}`);
    },
    async signIn({ user }) {
      console.log(`User signed in: ${user.id}`);
    },
    async signOut({ session }) {
      console.log(`User signed out`);
    },
  },
  pages: {
    signIn: "/login",
    signOut: "/",
    error: "/login", // Redirect to login page on error with error parameter
  },
  // Secret for signing cookies and tokens - use AUTH_SECRET or fallback to NEXTAUTH_SECRET
  secret: process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET,
  // Always enable debug mode 
  debug: true,
});