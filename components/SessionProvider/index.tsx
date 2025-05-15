"use client";

import { SessionProvider } from "next-auth/react";
import type { ReactNode } from "react";

interface SessionProviderWrapperProps {
  children: ReactNode;
}

/**
 * SessionProviderWrapper - Wraps the application with NextAuth's SessionProvider
 * Enables the useSession hook in client components
 */
export default function SessionProviderWrapper({ 
  children 
}: SessionProviderWrapperProps) {
  return <SessionProvider>{children}</SessionProvider>;
}