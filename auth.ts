// auth.ts

import NextAuth, { Profile } from "next-auth";
import GitHub from "next-auth/providers/github";
import prisma from "@/lib/prisma"; // Using our unified, serverless-safe client

// Define a more specific type for the GitHub profile to ensure properties exist
interface GitHubProfile extends Profile {
  login: string;
  avatar_url: string;
  name: string;
  email: string;
}

export const { handlers, signIn, signOut, auth } = NextAuth({
  // The adapter is now completely removed.
  // adapter: PrismaAdapter(prisma), // <--- THIS LINE IS GONE

  providers: [
    GitHub({
      clientId: process.env.AUTH_GITHUB_ID,
      clientSecret: process.env.AUTH_GITHUB_SECRET,
    }),
  ],
  session: {
    // We MUST use "jwt" for the session strategy when there is no database adapter.
    strategy: "jwt",
  },
  secret: process.env.AUTH_SECRET,
  trustHost: true,
  pages: {
    signIn: "/login",
  },
  callbacks: {
    // This callback now contains the logic that the adapter was failing to execute.
    async signIn({ user, account, profile }) {
      if (account?.provider !== "github" || !profile?.email) {
        return false;
      }

      const githubProfile = profile as GitHubProfile;

      try {
        // Find or create the user in our database
        const dbUser = await prisma.user.upsert({
          where: { email: githubProfile.email },
          update: {
            name: githubProfile.name,
            image: githubProfile.avatar_url,
          },
          create: {
            // Use the provider's ID for the user if you want, or let Prisma generate one
            id: user.id,
            email: githubProfile.email,
            name: githubProfile.name,
            image: githubProfile.avatar_url,
          },
        });

        // Find or create the account link
        await prisma.account.upsert({
          where: {
            provider_providerAccountId: {
              provider: account.provider,
              providerAccountId: account.providerAccountId,
            },
          },
          update: {
            access_token: account.access_token,
            refresh_token: account.refresh_token,
            expires_at: account.expires_at,
          },
          create: {
            userId: dbUser.id,
            type: account.type,
            provider: account.provider,
            providerAccountId: account.providerAccountId,
            access_token: account.access_token,
            refresh_token: account.refresh_token,
            expires_at: account.expires_at,
          },
        });

        return true; // Allow the sign-in
      } catch (error) {
        console.error("Error during signIn callback:", error);
        return false; // Prevent sign-in on database error
      }
    },

    // The JWT callback saves our database user ID into the token
    async jwt({ token, account, profile }) {
      if (account && profile) {
        const userInDb = await prisma.user.findUnique({
          where: { email: profile.email! },
        });
        if (userInDb) {
          token.id = userInDb.id; // Add our internal user ID to the token
        }
      }
      return token;
    },

    // The session callback adds our internal user ID from the token to the client-side session object
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
      }
      return session;
    },
  },
});
