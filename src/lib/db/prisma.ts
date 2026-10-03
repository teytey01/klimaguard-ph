import { PrismaClient } from "@prisma/client";

// Prisma client singleton. In dev, Next.js hot-reload would otherwise create a
// new client (and connection) on every change, exhausting connections — so we
// cache it on globalThis. In production a single instance is created per lambda.

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
