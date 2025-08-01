import type { NextAuthConfig } from "next-auth";
import GitHub from "next-auth/providers/github";

// Notice that this is a partial object, missing the database-related callbacks
export const authConfig = {
  providers: [
    GitHub({
      clientId: process.env.AUTH_GITHUB_ID,
      clientSecret: process.env.AUTH_GITHUB_SECRET,
    }),
  ],
  pages: {
    signIn: "/login",
  },
  session: {
    strategy: "jwt",
  },
  secret: process.env.AUTH_SECRET,
  trustHost: true,
  callbacks: {
    // This authorized callback is for the middleware.
    // It's called before the database-heavy signIn callback.
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      const protectedRoutes = ["/dashboard", "/profile", "/saved", "/chat"];
      const isProtectedRoute = protectedRoutes.some((path) =>
        nextUrl.pathname.startsWith(path)
      );

      if (isProtectedRoute && !isLoggedIn) {
        const loginUrl = new URL("/login", nextUrl.origin);
        loginUrl.searchParams.set("callbackUrl", nextUrl.href);
        return Response.redirect(loginUrl);
      }
      return true;
    },
  },
} satisfies NextAuthConfig;
