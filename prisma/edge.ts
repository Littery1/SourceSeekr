import { PrismaClient } from "@prisma/client";
import { PrismaNeon } from "@prisma/adapter-neon";
import { Pool } from "@neondatabase/serverless";

declare global {
  var prismaEdge: PrismaClient | undefined;
}

const neon = new Pool({ connectionString: process.env.DATABASE_EDGE_URL! });
const adapter = new PrismaNeon(neon);
const prisma = globalThis.prismaEdge ?? new PrismaClient({ adapter });

if (process.env.NODE_ENV !== "production") {
  globalThis.prismaEdge = prisma;
}

export default prisma;
