import NextAuth from "next-auth";
import { authConfig } from "./auth.config"; // Import the base config
import prisma from "./lib/prisma";
import { Profile } from "next-auth";

interface GitHubProfile extends Profile {
  login?: string;
  avatar_url?: string;
}

export const { handlers, signIn, signOut, auth } = NextAuth({
  ...authConfig, // Spread the base, Edge-safe config
  callbacks: {
    // We keep the 'authorized' callback from the config for consistency,
    // but it's primarily used by the middleware.
    ...authConfig.callbacks,

    // This signIn callback ONLY runs on the Node.js runtime via the API route.
    async signIn({ user, account, profile }) {
      if (!account || !profile?.email) return false;
      try {
        const githubProfile = profile as GitHubProfile;
        const userImage =
          (typeof profile.image === "string"
            ? profile.image
            : githubProfile.avatar_url) || null;

        const dbUser = await prisma.user.upsert({
          where: { email: profile.email },
          update: {
            name: profile.name ?? githubProfile.login ?? "GitHub User",
            image: userImage,
          },
          create: {
            id: user.id,
            email: profile.email,
            name: profile.name ?? githubProfile.login ?? "GitHub User",
            image: userImage,
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
      if (account && user) {
        // This is a database call, so it must only run in the Node.js runtime.
        const dbUser = await prisma.user.findUnique({
          where: { email: user.email! },
        });
        if (dbUser) {
          token.id = dbUser.id;
        }
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user && token.id) {
        session.user.id = token.id as string;
      }
      return session;
    },
  },
});
