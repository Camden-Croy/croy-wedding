import { PrismaClient } from "@/lib/generated/prisma/client";
import { PrismaNeon } from "@prisma/adapter-neon";

// Prisma 7 requires a driver adapter. We use the Neon serverless driver with the
// pooled connection string (DATABASE_URL, the `-pooler` host) so connections are
// pooled across serverless invocations.
const connectionString = process.env.DATABASE_URL;

function createClient() {
  const adapter = new PrismaNeon({ connectionString });
  return new PrismaClient({ adapter });
}

// Reuse the client across hot-reloads in development to avoid exhausting connections.
const globalForPrisma = globalThis as unknown as { prisma?: ReturnType<typeof createClient> };

export const prisma = globalForPrisma.prisma ?? createClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
