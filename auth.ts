import NextAuth from "next-auth";
import { PrismaAdapter } from "@auth/prisma-adapter";
import prisma from "./prisma/prisma";
import GithubProvider from "next-auth/providers/github";
// Remove other providers since we're only using GitHub

// Debugging environment variables
console.log("GitHub ID:", process.env.AUTH_GITHUB_ID || process.env.GITHUB_ID || "Not set");
console.log("GitHub Secret length:", 
  process.env.AUTH_GITHUB_SECRET 
    ? process.env.AUTH_GITHUB_SECRET.length 
    : process.env.GITHUB_SECRET 
      ? process.env.GITHUB_SECRET.length 
      : "Not set");

export const { handlers, auth, signIn, signOut } = NextAuth({
  session: { strategy: "jwt" },
  adapter: PrismaAdapter(prisma) as any,
  debug: process.env.NODE_ENV === "development",
  pages: {
    signIn: "/login",
    error: "/", // Redirect to home page on error
  },
  // Use standard NextAuth cookie settings
  cookies: {
    sessionToken: {
      name: `${process.env.NODE_ENV === "production" ? "__Secure-" : ""}next-auth.session-token`,
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: process.env.NODE_ENV === "production",
      },
    },
  },
  providers: [
    GithubProvider({
      clientId: process.env.AUTH_GITHUB_ID || process.env.GITHUB_ID || "",
      clientSecret: process.env.AUTH_GITHUB_SECRET || process.env.GITHUB_SECRET || "",
      // Simplified authorization config with only required scopes
      authorization: {
        params: {
          scope: "read:user user:email"
        },
      },
      // Simplified profile function with try/catch for error handling
      profile(profile, tokens) {
        try {
          console.log("GitHub authentication successful for:", profile.login);
          
          // Basic info needed for user account
          return {
            id: profile.id.toString(),
            name: profile.name || profile.login,
            email: profile.email,
            image: profile.avatar_url,
            // Store GitHub specific information for API authentication
            githubUsername: profile.login,
            githubAccessToken: tokens.access_token,
          };
        } catch (error) {
          console.error("Error in GitHub profile callback:", error);
          throw error; // Re-throw to ensure NextAuth properly handles the error
        }
      },
    }),
  ],

});
