// auth.ts

import NextAuth, { Profile } from "next-auth";
import GitHub from "next-auth/providers/github";
import prisma from "@/lib/prisma";

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
    // Replace your old signIn callback with this one
    async signIn({ user, account, profile }) {
      if (!account || !profile?.email) {
        console.error("SignIn aborted: account or profile email is missing.");
        return false;
      }
      try {
        const githubProfile = profile as GitHubProfile;
        const userImage = githubProfile.avatar_url || user.image || null;

        // --- THIS IS THE FIX ---
        // Establish a guaranteed string for the name.
        // Preference: GitHub display name > GitHub username (login)
        const finalName = profile.name || githubProfile.login;

        // If for some reason a name cannot be determined, deny sign-in.
        if (!finalName) {
          console.error(
            "SignIn failed: Could not determine user's name from GitHub profile."
          );
          return false;
        }
        // -----------------------

        const dbUser = await prisma.user.upsert({
          where: { email: profile.email },
          update: {
            name: finalName, // Use the guaranteed string value
            image: userImage,
          },
          create: {
            id: user.id!, // user.id is present at this stage
            email: profile.email,
            name: finalName, // Use the guaranteed string value
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
