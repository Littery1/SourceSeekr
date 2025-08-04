// auth.ts
import NextAuth from "next-auth";
import GitHub from "next-auth/providers/github";

// Validate required environment variables
if (!process.env.AUTH_GITHUB_ID) {
  throw new Error("Missing AUTH_GITHUB_ID environment variable");
}

if (!process.env.AUTH_GITHUB_SECRET) {
  throw new Error("Missing AUTH_GITHUB_SECRET environment variable");
}

if (!process.env.AUTH_SECRET) {
  throw new Error("Missing AUTH_SECRET environment variable");
}

// Simplified NextAuth config WITHOUT database adapter
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
  // Use JWT session strategy since we're not using a database
  session: {
    strategy: "jwt",
  },
  // Temporarily remove callbacks and adapter
});
