// lib/prisma.ts
import { PrismaClient } from "@prisma/client";
import { PrismaNeon } from "@prisma/adapter-neon";
import { Pool } from "@neondatabase/serverless";

// Declare a global type for the PrismaClient instance attached to globalThis
// This helps with Next.js hot reloading in development
declare global {
  var prisma: PrismaClient | undefined;
}

let prisma: PrismaClient;

if (process.env.NODE_ENV === "production") {
  // In production, always create a new Prisma Client instance
  // Use the unpooled connection string for serverless functions
  const unpooledUrl = process.env.MY_DATABASE_URL_NON_POOLING;

  if (!unpooledUrl) {
    throw new Error("Missing MY_DATABASE_URL_NON_POOLING environment variable");
  }

  const adapter = new PrismaNeon(new Pool({ connectionString: unpooledUrl }));
  prisma = new PrismaClient({ adapter });
} else {
  // In development, use a global variable to prevent multiple instances
  // This is also helpful for serverless environments in development
  if (!global.prisma) {
    // Use the unpooled connection string for serverless functions
    const unpooledUrl = process.env.MY_DATABASE_URL_NON_POOLING;

    if (!unpooledUrl) {
      throw new Error(
        "Missing MY_DATABASE_URL_NON_POOLING environment variable"
      );
    }

    const adapter = new PrismaNeon(new Pool({ connectionString: unpooledUrl }));
    global.prisma = new PrismaClient({ adapter });
  }
  prisma = global.prisma;
}

export default prisma;
