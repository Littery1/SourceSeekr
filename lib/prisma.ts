// lib/prisma.ts

import { PrismaClient } from "@prisma/client";
import { PrismaNeon } from "@prisma/adapter-neon";
import { Pool } from "@neondatabase/serverless";

// This block is for preventing multiple Prisma Client instances in development.
// It's a standard and safe pattern.
declare global {
  var prisma: PrismaClient | undefined;
}

// This uses the official Vercel environment variable for the POOLED connection string.
// This is the key for making it work in a serverless environment.
const neon = new Pool({ connectionString: process.env.POSTGRES_PRISMA_URL! });
const adapter = new PrismaNeon(neon);

// Create the single instance of the client.
const prisma = globalThis.prisma || new PrismaClient({ adapter });

// Store the instance in the globalThis object in development.
if (process.env.NODE_ENV !== "production") {
  globalThis.prisma = prisma;
}

// Export the single, serverless-safe client.
export default prisma;
