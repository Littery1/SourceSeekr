import NextAuth from "next-auth";
import { authConfig } from "./auth.config"; // <-- IMPORTANT: Import from the Edge-safe config ONLY

export default NextAuth(authConfig).auth;

export const config = {
  // Match all paths except for static files, images, and the NextAuth API routes themselves.
  matcher: ["/((?!api/auth|_next/static|_next/image|favicon.ico|images).*)"],
};
