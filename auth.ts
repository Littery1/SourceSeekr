import NextAuth, {
  type Session,
  type Account,
  type Profile,
  type User,
} from "next-auth";
import GitHub from "next-auth/providers/github";
import { PrismaAdapter } from "@auth/prisma-adapter";
import prisma from "./prisma/prisma";

// --- Environment Variable Validation ---
// This ensures that the required variables are present at runtime.
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

console.log("NextAuth initialization - Environment checks passed.");

export const { handlers, signIn, signOut, auth } = NextAuth({
  adapter: PrismaAdapter(prisma),
  providers: [
    GitHub({
      // By using the validated constants, TypeScript knows these are strings.
      clientId: GITHUB_CLIENT_ID,
      clientSecret: GITHUB_CLIENT_SECRET,
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
    async session({ session, user }: { session: Session; user: User }) {
      console.log("Session Callback - creating session with user ID");

      // Add the user ID to the session
      // The `user.id` check satisfies TypeScript's strict null checks.
      if (session.user && user.id) {
        session.user.id = user.id;
      }

      return session;
    },
    async signIn({
      user,
      account,
      profile,
    }: {
      user: User;
      account: Account | null;
      profile?: Profile;
    }) {
      console.log("SignIn Callback - processing GitHub login");

      if (account?.provider === "github") {
        if (!user.email) {
          console.warn(
            "GitHub user email is null. Sign-in cannot proceed without an email."
          );
          return false; // Prevent sign-in if email is not available
        }

        const existingUser = await prisma.user.findUnique({
          // The check above guarantees user.email is not null, so the '!' is not needed.
          where: { email: user.email },
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
    redirect({ url, baseUrl }: { url: string; baseUrl: string }) {
      console.log("Redirect Callback - handling redirect", { url, baseUrl });

      // If the URL starts with the base URL or is a relative URL, allow it
      if (url.startsWith("/")) return `${baseUrl}${url}`;
      else if (new URL(url).origin === baseUrl) return url;

      // Otherwise redirect to the base URL
      return baseUrl;
    },
  },
  events: {
    async createUser({ user }: { user: User }) {
      console.log(`New user created: ${user.id}, email: ${user.email}`);
    },
    async signIn({ user }: { user: User }) {
      console.log(`User signed in: ${user.id}`);
    },
    async signOut({ session }: { session: Session }) {
      console.log(`User signed out`);
    },
  },
  pages: {
    signIn: "/login",
    signOut: "/",
    error: "/login", // Redirect to login page on error with error parameter
  },
  // Secret for signing cookies and tokens
  secret: AUTH_SECRET,
  // Always enable debug mode
  debug: true,
});
