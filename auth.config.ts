import type { NextAuthConfig } from "next-auth";

// This configuration is used ONLY by the middleware.
// It is lightweight and does not include database adapters or providers.
export const authConfig = {
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
        // Redirect unauthenticated users to the login page.
        return Response.redirect(
          new URL(`/login?callbackUrl=${nextUrl.href}`, nextUrl.origin)
        );
      }

      if (isAuthRoute && isLoggedIn) {
        // Redirect authenticated users away from login/register pages.
        return Response.redirect(new URL("/dashboard", nextUrl.origin));
      }

      // Allow all other requests.
      return true;
    },
  },
  providers: [], // Providers are not needed in the middleware.
} satisfies NextAuthConfig;
