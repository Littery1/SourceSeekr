import { auth } from "@/auth";

export default auth;

export const config = {
  // This matcher protects all routes except for static assets and images.
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|images).*)"],
};
