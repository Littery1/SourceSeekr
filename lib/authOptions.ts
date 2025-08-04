// lib/authOptions.ts

import type { NextAuthOptions, Session, User } from "next-auth"; // Correct import
import GitHub from "next-auth/providers/github";
import { AdapterUser } from "next-auth/adapters";
import { PrismaAdapter } from "@auth/prisma-adapter";
import prisma from "@/lib/prisma";

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  providers: [
    GitHub({
      clientId: process.env.AUTH_GITHUB_ID!,
      clientSecret: process.env.AUTH_GITHUB_SECRET!,
    }),
  ],
  session: {
    strategy: "database",
  },
  secret: process.env.AUTH_SECRET,
  trustHost: true,
  pages: {
    signIn: "/login",
  },
  callbacks: {
    // This callback is correctly typed now
    async session({
      session,
      user,
    }: {
      session: Session;
      user: User | AdapterUser;
    }) {
      if (session.user && user) {
        session.user.id = user.id;
      }
      return session;
    },
  },
};
