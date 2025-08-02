import NextAuth, { Profile } from "next-auth";
import GitHub from "next-auth/providers/github";
import prisma from "@/lib/prisma";
import { authConfig } from "./auth.config"; // Import the base config

interface GitHubProfile extends Profile {
  login?: string;
  avatar_url?: string;
}

export const { handlers, signIn, signOut, auth } = NextAuth({
  ...authConfig, // Spread the base, Edge-safe config
  providers: [
    // Add providers here for the API routes to use
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
  callbacks: {
    ...authConfig.callbacks, // Keep the authorized callback from the base config

    // This signIn callback uses Prisma and will ONLY run in the Node.js runtime.
    async signIn({ user, account, profile }) {
      if (!account || !profile?.email) return false;
      try {
        const githubProfile = profile as GitHubProfile;
        const userImage = githubProfile.avatar_url || user.image || null;
        const finalName = profile.name || githubProfile.login;

        if (!finalName) return false;

        const dbUser = await prisma.user.upsert({
          where: { email: profile.email },
          update: {
            name: finalName,
            image: userImage,
          },
          create: {
            id: user.id!,
            email: profile.email,
            name: finalName,
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
        console.error("Auth.js signIn callback database error:", error);
        return false;
      }
    },
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
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
