import { PrismaClient } from "@prisma/client";
import { PrismaNeon } from "@prisma/adapter-neon";
import { Pool } from "@neondatabase/serverless";

declare global {
  var prisma: PrismaClient | undefined;
}

// This correctly uses POSTGRES_PRISMA_URL, which will now be defined locally.
const neon = new Pool({ connectionString: process.env.POSTGRES_PRISMA_URL! });
const adapter = new PrismaNeon(neon);

const prisma = globalThis.prisma || new PrismaClient({ adapter });

if (process.env.NODE_ENV !== "production") {
  globalThis.prisma = prisma;
}

export default prisma;
