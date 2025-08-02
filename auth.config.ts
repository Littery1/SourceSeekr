import type { NextAuthConfig } from "next-auth";

export const authConfig = {
  providers: [], // The middleware doesn't need to know about providers.
  pages: {
    signIn: "/login",
  },
  callbacks: {
    // This authorized callback is the core of the middleware logic.
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
        // Redirect unauthenticated users to the login page, preserving the URL they were trying to access.
        return Response.redirect(
          new URL(`/login?callbackUrl=${nextUrl.href}`, nextUrl.origin)
        );
      }

      if (isAuthRoute && isLoggedIn) {
        // Redirect authenticated users away from login/register pages to the dashboard.
        return Response.redirect(new URL("/dashboard", nextUrl.origin));
      }

      // Allow the request to proceed if no redirect is needed.
      return true;
    },
  },
} satisfies NextAuthConfig;
