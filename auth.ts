import NextAuth from "next-auth";
import GithubProvider from "next-auth/providers/github";

// Enable verbose debugging (will appear in Vercel logs)
console.log("NextAuth initialization - Environment:");
console.log("- NODE_ENV:", process.env.NODE_ENV);
console.log("- NEXTAUTH_URL:", process.env.NEXTAUTH_URL);
console.log("- NEXTAUTH_SECRET exists:", !!process.env.NEXTAUTH_SECRET);
console.log("- GitHub ID exists:", !!(process.env.AUTH_GITHUB_ID || process.env.GITHUB_ID));
console.log("- GitHub Secret exists:", !!(process.env.AUTH_GITHUB_SECRET || process.env.GITHUB_SECRET));

// Minimal configuration to isolate issues
export const { handlers, auth, signIn, signOut } = NextAuth({
  // Always enable debug mode to catch issues
  debug: true,
  
  // Use JWT for simplicity (no database dependency)
  session: { 
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  
  // Pages configuration - tell NextAuth where our custom pages are
  pages: {
    signIn: "/login",
    signOut: "/",
    error: "/login", // Redirect to login page on error with error parameter
  },
  
  // Only the absolute minimum configuration
  providers: [
    GithubProvider({
      clientId: process.env.AUTH_GITHUB_ID || process.env.GITHUB_ID || "",
      clientSecret: process.env.AUTH_GITHUB_SECRET || process.env.GITHUB_SECRET || "",
      // Add profile function with better error handling
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
  
  // Secret for signing cookies and tokens
  secret: process.env.NEXTAUTH_SECRET,
  
  // Log all callbacks for debugging
  callbacks: {
    async jwt({ token, account, profile }) {
      console.log("JWT Callback - token:", { ...token, sub: token.sub ? "[FILTERED]" : undefined });
      
      // If this is the first sign-in, add the access token
      if (account && profile) {
        console.log("First sign-in detected, adding GitHub token to JWT");
        token.accessToken = account.access_token;
      }
      return token;
    },
    
    async session({ session, token }) {
      console.log("Session Callback - creating session from token");
      // Add the access token to the session
      session.accessToken = token.accessToken;
      return session;
    }
  }
});
