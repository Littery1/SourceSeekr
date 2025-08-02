import NextAuth from "next-auth";
import { authConfig } from "./auth.config";

export default NextAuth(authConfig).auth;

export const config = {
  // Match all routes except for API routes, static files, and images.
  matcher: ["/((?!api|_next/static|_next/image|.*\\.png$).*)"],
};
