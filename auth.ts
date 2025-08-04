// auth.ts
import NextAuth from "next-auth";
import GitHub from "next-auth/providers/github";

// Environment variable validation
if (!process.env.AUTH_GITHUB_ID) {
  throw new Error("Missing AUTH_GITHUB_ID environment variable");
}

if (!process.env.AUTH_GITHUB_SECRET) {
  throw new Error("Missing AUTH_GITHUB_SECRET environment variable");
}

if (!process.env.AUTH_SECRET) {
  throw new Error("Missing AUTH_SECRET environment variable");
}

export const {
  handlers: { GET, POST },
  auth,
  signIn,
  signOut,
} = NextAuth({
  providers: [
    GitHub({
      clientId: process.env.AUTH_GITHUB_ID,
      clientSecret: process.env.AUTH_GITHUB_SECRET,
    }),
  ],
  secret: process.env.AUTH_SECRET,
  // Use JWT session strategy (no database needed for this test)
  session: {
    strategy: "jwt",
  },
  // Remove any callbacks or adapter for now
});

// Add a simple test log to verify the module loads
console.log("✅ NextAuth module loaded successfully");
