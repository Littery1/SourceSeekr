// auth.ts
import NextAuth from "next-auth";
import GitHub from "next-auth/providers/github";

// Environment variable validation with explicit typing
const AUTH_GITHUB_ID = process.env.AUTH_GITHUB_ID;
const AUTH_GITHUB_SECRET = process.env.AUTH_GITHUB_SECRET;
const AUTH_SECRET = process.env.AUTH_SECRET;

if (!AUTH_GITHUB_ID) {
  throw new Error("Missing AUTH_GITHUB_ID environment variable");
}

if (!AUTH_GITHUB_SECRET) {
  throw new Error("Missing AUTH_GITHUB_SECRET environment variable");
}

if (!AUTH_SECRET) {
  throw new Error("Missing AUTH_SECRET environment variable");
}

// Correct NextAuth v5 Beta configuration with explicit typing
const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    GitHub({
      clientId: AUTH_GITHUB_ID,
      clientSecret: AUTH_GITHUB_SECRET,
    }),
  ],
  secret: AUTH_SECRET,
  // Use JWT for session handling (no database required for this test)
  session: {
    strategy: "jwt",
  },
});

// Explicit exports for App Router
export { handlers, auth, signIn, signOut };
export const { GET, POST } = handlers;
