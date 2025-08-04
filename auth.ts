// auth.ts

import NextAuth from "next-auth";
import { authOptions } from "@/lib/authOptions"; // Import the configuration

export const { handlers, signIn, signOut, auth } = NextAuth(authOptions);
