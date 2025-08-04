// auth.ts (DATABASE ISOLATION TEST)

import NextAuth from "next-auth";
import GitHub from "next-auth/providers/github";

// Notice we are NOT importing Prisma for this test.

export const { handlers, signIn, signOut, auth } = NextAuth({
  // The Prisma adapter has been completely removed for this test.
  // adapter: PrismaAdapter(prisma),

  providers: [
    GitHub({
      clientId: process.env.AUTH_GITHUB_ID,
      clientSecret: process.env.AUTH_GITHUB_SECRET,
    }),
  ],
  session: {
    // We MUST use "jwt" for the session strategy when not using a database adapter.
    strategy: "jwt",
  },
  secret: process.env.AUTH_SECRET,
  trustHost: true,
  pages: {
    signIn: "/login",
  },
  callbacks: {
    // This callback ensures the session object still gets a user ID,
    // but it will be the user's GitHub ID, not our database ID.
    async session({ session, token }) {
      if (session.user && token.sub) {
        session.user.id = token.sub;
      }
      return session;
    },
  },
});
