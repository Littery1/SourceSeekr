// auth.ts

import NextAuth from "next-auth";
import GitHub from "next-auth/providers/github";
import prisma from "@/lib/prisma"; // This imports the Accelerate-enabled client

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
      if (account?.provider !== "github" || !profile?.email) {
        return false;
      }

      try {
        // Provide safe fallbacks for potentially null/undefined values from the profile
        const userName =
          profile.name ?? (profile as any).login ?? "GitHub User";
        const userImage = profile.image ?? (profile as any).avatar_url ?? null;

        const dbUser = await prisma.user.upsert({
          where: { email: profile.email },
          update: {
            name: userName,
            image: userImage,
          },
          create: {
            id: user.id!,
            email: profile.email,
            name: userName,
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
            type: account.type!,
            provider: account.provider,
            providerAccountId: account.providerAccountId,
            access_token: account.access_token,
            refresh_token: account.refresh_token,
            expires_at: account.expires_at,
          },
        });
        return true;
      } catch (error) {
        console.error("Auth.js signIn callback error:", error);
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
