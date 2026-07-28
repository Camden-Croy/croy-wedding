import "dotenv/config";
import { PrismaClient } from "../lib/generated/prisma/client";
import { PrismaNeon } from "@prisma/adapter-neon";
import { REGISTRY_ITEMS } from "../lib/content";

/**
 * Registry-only refresh.
 *
 * Unlike prisma/seed.ts (which also rebuilds wedding, partners, photos, and
 * guests — wiping RSVPs in the process), this script touches ONLY the
 * RegistryItem table. It replaces every registry row with the current
 * REGISTRY_ITEMS list from lib/content.ts, leaving guests and RSVPs untouched.
 *
 * Run with:  npx tsx prisma/update-registry.ts
 */

const adapter = new PrismaNeon({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

async function main() {
  await prisma.registryItem.deleteMany();
  await prisma.registryItem.createMany({
    data: REGISTRY_ITEMS.map((r, i) => ({
      title: r.title,
      description: r.description,
      url: r.url ?? null,
      priceCents: r.priceCents ?? null,
      category: r.category,
      note: r.note ?? null,
      isFund: r.isFund ?? false,
      order: i,
    })),
  });

  const count = await prisma.registryItem.count();
  console.log(`Registry updated: ${count} items.`);
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (err) => {
    console.error(err);
    await prisma.$disconnect();
    process.exit(1);
  });
