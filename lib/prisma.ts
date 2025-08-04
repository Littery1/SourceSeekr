// lib/prisma.ts

import { PrismaClient } from "@prisma/client/edge";
import { withAccelerate } from "@prisma/extension-accelerate";

// This defines the type of the extended client
const prismaClientSingleton = () => {
  return new PrismaClient().$extends(withAccelerate());
};

// This correctly types the global variable
declare global {
  var prisma: undefined | ReturnType<typeof prismaClientSingleton>;
}

const prisma = globalThis.prisma ?? prismaClientSingleton();

if (process.env.NODE_ENV !== "production") {
  globalThis.prisma = prisma;
}

export default prisma;
