// auth.ts

import NextAuth from "next-auth";
import GitHub from "next-auth/providers/github";
import { PrismaAdapter } from "@auth/prisma-adapter";

// --- Direct Prisma/Neon Initialization ---
// We are doing this directly inside auth.ts to avoid any potential
// module resolution issues in the Vercel serverless environment.
import { PrismaClient } from "@prisma/client";
import { PrismaNeon } from "@prisma/adapter-neon";
import { Pool } from "@neondatabase/serverless";

const neon = new Pool({ connectionString: process.env.DATABASE_URL! });
const adapter = new PrismaNeon(neon);
const prisma = new PrismaClient({ adapter });
// --- End of Prisma/Neon Initialization ---

export const { handlers, signIn, signOut, auth } = NextAuth({
  // We pass the locally initialized, serverless-safe client to the adapter.
  adapter: PrismaAdapter(prisma),
  providers: [
    GitHub({
      clientId: process.env.AUTH_GITHUB_ID,
      clientSecret: process.env.AUTH_GITHUB_SECRET,
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
    async session({ session, user }) {
      if (session.user && user) {
        session.user.id = user.id;
      }
      return session;
    },
  },
});
