import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../../node_modules/.prisma/client";

import { MSG } from "@/lib/http/messages";

declare global {
  var prisma: PrismaClient | undefined;
}

function createPrismaClient() {
  const connectionString = process.env.DATABASE_URL;

  if (!connectionString) {
    throw new Error(MSG.config.databaseUrlMissing);
  }

  const adapter = new PrismaPg({ connectionString });

  return new PrismaClient({ adapter });
}

export const prisma = global.prisma || createPrismaClient();

if (process.env.NODE_ENV !== "production") global.prisma = prisma;
