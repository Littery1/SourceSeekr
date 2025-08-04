// lib/prisma.ts
import { PrismaClient } from "@prisma/client";
import { PrismaNeon } from "@prisma/adapter-neon";
import { Pool } from "@neondatabase/serverless";

declare global {
  var prisma: PrismaClient | undefined;
}

// Ensure the environment variable exists
const unpooledUrl = process.env.POSTGRES_URL_NON_POOLING;
if (!unpooledUrl) {
  throw new Error("Missing POSTGRES_URL_NON_POOLING environment variable");
}

// Manually construct the pooled URL
const pooledUrl = `${unpooledUrl}&pgbouncer=true`;

// Create the connection pool and adapter
const pool = new Pool({ connectionString: pooledUrl });
const adapter = new PrismaNeon(pool);

// Create Prisma Client with the Neon adapter
const prisma =
  global.prisma ||
  new PrismaClient({
    adapter,
    log:
      process.env.NODE_ENV === "development"
        ? ["query", "error", "warn"]
        : ["error"],
  });

// Prevent multiple instances in development
if (process.env.NODE_ENV !== "production") {
  global.prisma = prisma;
}

export default prisma;
