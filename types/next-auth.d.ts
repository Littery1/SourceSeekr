import { DefaultSession, User as DefaultUser } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      // Add other custom fields you might need
    } & DefaultSession["user"]; // Preserve standard name, email, image
  }

  // If you need to extend the User object you receive in callbacks
  interface User extends DefaultUser {
    // You can add custom fields here if needed
  }
}