import "dotenv/config";
import { PrismaClient } from "../lib/generated/prisma/client";
import { PrismaNeon } from "@prisma/adapter-neon";
import { VALID_ACCESS_CODES } from "../lib/content";

/**
 * Guest-only migration.
 *
 * Unlike prisma/seed.ts (which rebuilds wedding, partners, photos, registry,
 * AND guests — wiping RSVPs and registry claims in the process), this script
 * touches ONLY the Guest table. Existing guests, RSVPs, and claims are left
 * intact.
 *
 * Changes:
 *   - Removes Preston Peterson
 *   - Grants a plus-one to Julie Ann Peterson and Maris Morton
 *   - Adds the new invitees (idempotent upsert; identifiers that already exist,
 *     e.g. isaiah_stinnett, are left untouched rather than duplicated)
 *
 * Run with:  npx tsx prisma/update-guests.ts
 */

const adapter = new PrismaNeon({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

const CODE = VALID_ACCESS_CODES[0]; // "love2026"

// Guests to remove.
const REMOVE = ["preston_peterson"];

// Guests to grant a plus-one.
const GRANT_PLUS_ONE = ["julie_ann_peterson", "maris_morton"];

// New guests to add. plusOne defaults to false when omitted.
const NEW_GUESTS: { identifier: string; name: string; plusOne?: boolean }[] = [
  { identifier: "mark_croy", name: "Mark Croy" },
  { identifier: "sharon_croy", name: "Sharon Croy" },
  { identifier: "lexie_croy", name: "Lexie Croy" },
  { identifier: "trey_croy", name: "Trey Croy" },
  { identifier: "mr_stacy", name: "Mr Stacy" },
  { identifier: "mrs_stacy", name: "Mrs Stacy" },
  { identifier: "logan_stacy", name: "Logan Stacy" },
  { identifier: "brandon_taylor", name: "Brandon Taylor" },
  { identifier: "summer_woody", name: "Summer Woody" },
  { identifier: "camden_croy", name: "Camden Croy" },
  { identifier: "jordan_stacy", name: "Jordan Stacy" },
  // Already invited — upsert keeps the existing row rather than duplicating it.
  { identifier: "isaiah_stinnett", name: "Isaiah Stinnett" },
];

async function main() {
  // 1. Remove.
  const removed = await prisma.guest.deleteMany({
    where: { identifier: { in: REMOVE } },
  });

  // 2. Grant plus-ones.
  const upgraded = await prisma.guest.updateMany({
    where: { identifier: { in: GRANT_PLUS_ONE } },
    data: { plusOne: true },
  });

  // 3. Add new guests (idempotent).
  let created = 0;
  for (const g of NEW_GUESTS) {
    const existing = await prisma.guest.findUnique({
      where: { identifier: g.identifier },
    });
    if (existing) continue;
    await prisma.guest.create({
      data: {
        identifier: g.identifier,
        name: g.name,
        accessCode: CODE,
        plusOne: g.plusOne ?? false,
      },
    });
    created += 1;
  }

  const total = await prisma.guest.count();
  console.log(
    `Guests migrated: removed ${removed.count}, plus-one granted to ${upgraded.count}, added ${created} new. ${total} total guests.`,
  );
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (err) => {
    console.error(err);
    await prisma.$disconnect();
    process.exit(1);
  });
