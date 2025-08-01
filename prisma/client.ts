// prisma/client.ts

import { PrismaClient } from "@prisma/client";
import { PrismaNeon } from "@prisma/adapter-neon";
import { Pool } from "@neondatabase/serverless";

// Initialize the connection pool
const neon = new Pool({ connectionString: process.env.DATABASE_URL! });
// Initialize the Prisma adapter
const adapter = new PrismaNeon(neon);
// Create and export the single, serverless-safe Prisma client instance
const prisma = new PrismaClient({ adapter });

export default prisma;
