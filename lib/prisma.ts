import { PrismaClient } from "@prisma/client";

// In dev, Next.js hot-reloads modules, which would otherwise create a new
// PrismaClient (and a new DB connection) on every file save. Stashing it on
// `global` keeps a single connection alive across reloads.
const globalForPrisma = global as unknown as { prisma?: PrismaClient };

export const prisma = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
