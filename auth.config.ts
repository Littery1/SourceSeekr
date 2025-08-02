import type { NextAuthConfig } from "next-auth";
import GitHub from "next-auth/providers/github";

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
    // This authorized callback runs in the middleware on the Edge.
    // It should NOT contain any database logic.
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      const protectedRoutes = ["/dashboard", "/profile", "/saved", "/chat"];
      const authRoutes = ["/login", "/register"];

      const isProtectedRoute = protectedRoutes.some((path) =>
        nextUrl.pathname.startsWith(path)
      );
      const isAuthRoute = authRoutes.some((path) =>
        nextUrl.pathname.startsWith(path)
      );

      if (isProtectedRoute && !isLoggedIn) {
        // Redirect unauthenticated users to the login page.
        return Response.redirect(
          new URL(`/login?callbackUrl=${nextUrl.href}`, nextUrl.origin)
        );
      }

      if (isAuthRoute && isLoggedIn) {
        // Redirect authenticated users away from login/register pages.
        return Response.redirect(new URL("/dashboard", nextUrl.origin));
      }

      return true; // Allow the request to proceed.
    },
    // We only need JWT and Session callbacks in the main auth.ts for the Node.js runtime
    // to add the user ID to the session token.
  },
} satisfies NextAuthConfig;
