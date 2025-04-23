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

export const { handlers, auth, signIn, signOut, authOptions } = NextAuth({
  session: { strategy: "jwt" },
  adapter: PrismaAdapter(prisma),
  debug: process.env.NODE_ENV === "development",
  pages: {
    signIn: "/login",
    error: "/", // Redirect to home page on error
  },
  providers: [
    GithubProvider({
      clientId: process.env.AUTH_GITHUB_ID || process.env.GITHUB_ID || "",
      clientSecret: process.env.AUTH_GITHUB_SECRET || process.env.GITHUB_SECRET || "",
      authorization: {
        url: "https://github.com/login/oauth/authorize",
        params: {
          // Specify what access we want for GitHub API authentication
          // - read:user: Read user profile data
          // - user:email: Access private email
          // - repo: Full access to public and private repositories
          // - public_repo: Limited access to public repositories only
          scope: "read:user user:email repo public_repo",
          // Add anti-caching timestamp to force new auth flow each time
          t: Date.now().toString()
        },
      },
      // Custom profile function to extract all the data we need
      profile(profile, tokens) {
        console.log("GitHub authentication successful for:", profile.login);
        
        // Log token existence and scopes (not the token itself for security)
        const hasToken = !!tokens.access_token;
        const tokenType = tokens.token_type || 'bearer';
        const scopes = tokens.scope?.split(' ') || [];
        
        console.log(`GitHub auth token received: ${hasToken ? 'Yes' : 'No'}`);
        console.log(`GitHub token type: ${tokenType}`);
        console.log(`GitHub token scopes: ${scopes.join(', ')}`);
        
        return {
          id: profile.id.toString(),
          name: profile.name || profile.login,
          email: profile.email,
          image: profile.avatar_url,
          // Store GitHub specific information for API authentication
          githubUsername: profile.login,
          githubAccessToken: tokens.access_token,
          // Store additional token information for debugging
          githubTokenType: tokenType,
          githubTokenScopes: scopes,
        };
      },
    }),
  ],

});
