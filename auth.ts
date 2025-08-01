// auth.ts

import NextAuth, { Profile } from "next-auth";
import GitHub from "next-auth/providers/github";
import prisma from "@/lib/prisma"; // Using our unified, serverless-safe client

// We extend the default Profile type to include properties from the GitHub provider
interface GitHubProfile extends Profile {
  login?: string;
  avatar_url?: string;
}

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    GitHub({
      clientId: process.env.AUTH_GITHUB_ID,
      clientSecret: process.env.AUTH_GITHUB_SECRET,
    }),
  ],
  session: {
    strategy: "jwt",
  },
  secret: process.env.AUTH_SECRET,
  trustHost: true,
  pages: {
    signIn: "/login",
  },
  callbacks: {
    async signIn({ user, account, profile }) {
      if (!account || !profile?.email) {
        return false;
      }

      try {
        const githubProfile = profile as GitHubProfile;

        // --- THIS IS THE FIX ---
        // Ensure the image property is a string or null, not an empty object.
        const userImage =
          (typeof profile.image === "string"
            ? profile.image
            : githubProfile.avatar_url) || null;

        const dbUser = await prisma.user.upsert({
          where: { email: profile.email },
          update: {
            name: profile.name ?? githubProfile.login ?? "GitHub User",
            image: userImage, // Use the sanitized image URL
          },
          create: {
            id: user.id,
            email: profile.email,
            name: profile.name ?? githubProfile.login ?? "GitHub User",
            image: userImage, // Use the sanitized image URL
          },
        });

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
            token_type: account.token_type,
            scope: account.scope,
            id_token: account.id_token,
          },
        });

        return true;
      } catch (error) {
        console.error("Auth.js signIn callback error:", error);
        return false;
      }
    },

    async jwt({ token, user, account }) {
      if (user?.id) {
        // Find the user in our DB to ensure the token ID matches our internal UUID
        const dbUser = await prisma.user.findFirst({
          where: {
            accounts: {
              some: {
                provider: account?.provider,
                providerAccountId: account?.providerAccountId,
              },
            },
          },
        });
        if (dbUser) {
          token.id = dbUser.id;
        }
      }
      return token;
    },

    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
      }
      return session;
    },
  },
});
