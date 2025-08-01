import { PrismaClient } from "../prisma/generated/edge";
/// <reference types="node" />

const prismaClientSingleton = () => {
  return new PrismaClient({
    datasources: {
      db: {
        url: process.env.DATABASE_EDGE_URL!,
      },
    },
  });
};

declare global {
  var prismaEdge: undefined | ReturnType<typeof prismaClientSingleton>;
}

const prisma = globalThis.prismaEdge ?? prismaClientSingleton();

export default prisma;

if (process.env.NODE_ENV !== "production") {
  globalThis.prismaEdge = prisma;
}
