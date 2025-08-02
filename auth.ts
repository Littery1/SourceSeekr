import NextAuth, { Profile } from "next-auth";
import GitHub from "next-auth/providers/github";
import prisma from "@/lib/prisma";

// This is the main configuration used by your API routes.
// It includes database interactions.
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
    // This signIn callback uses Prisma and will only run in the Node.js runtime.
    async signIn({ user, account, profile }) {
      if (!account || !profile?.email) {
        return false; // Deny access if essential info is missing
      }
      try {
        const githubProfile = profile as Profile & {
          login?: string;
          avatar_url?: string;
        };
        const userImage = githubProfile.avatar_url || user.image || null;

        const dbUser = await prisma.user.upsert({
          where: { email: profile.email },
          update: {
            name: user.name ?? githubProfile.login,
            image: userImage,
          },
          create: {
            id: user.id,
            email: profile.email,
            name: user.name ?? githubProfile.login,
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
        return true; // Allow sign-in
      } catch (error) {
        console.error("Auth.js signIn callback database error:", error);
        return false; // Deny access on database error
      }
    },
    // These callbacks add the database user ID to the token and session.
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
