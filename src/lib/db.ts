
import { setDefaultResultOrder } from "node:dns";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@/generated/prisma/client";

setDefaultResultOrder("ipv4first");

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
  prismaConnectionString: string | undefined;
};

function createPrismaClient(connectionString: string) {
  const adapter = new PrismaPg({
    connectionString,
  });

  return new PrismaClient({ adapter });
}

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL is not configured in .env.local");
}

if (
  !globalForPrisma.prisma ||
  globalForPrisma.prismaConnectionString !== connectionString
) {
  void globalForPrisma.prisma?.$disconnect().catch(() => {});
  globalForPrisma.prisma = createPrismaClient(connectionString);
  globalForPrisma.prismaConnectionString = connectionString;
}

export const prisma: PrismaClient = globalForPrisma.prisma;
