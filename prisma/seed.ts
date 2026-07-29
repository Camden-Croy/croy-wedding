import "dotenv/config";
import { PrismaClient } from "../lib/generated/prisma/client";
import { PrismaNeon } from "@prisma/adapter-neon";
import { PARTNERS, PHOTOS, REGISTRY_ITEMS, VALID_ACCESS_CODES } from "../lib/content";

const adapter = new PrismaNeon({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

async function main() {
  // Wedding details (single row).
  await prisma.wedding.deleteMany();
  await prisma.wedding.create({
    data: {
      location: "Cades Cove Missionary Baptist Church · Cades Cove, TN",
      rsvpUrl: "https://example.com/rsvp", // TODO: real RSVP destination
      story: null, // TODO: how Camden & Jordan met
    },
  });

  // The couple.
  await prisma.partner.deleteMany();
  await prisma.partner.createMany({
    data: [
      { firstName: PARTNERS.one.firstName, lastName: PARTNERS.one.lastName, order: 0 },
      { firstName: PARTNERS.two.firstName, lastName: PARTNERS.two.lastName, order: 1 },
    ],
  });

  // Gallery photos.
  await prisma.photo.deleteMany();
  await prisma.photo.createMany({
    data: PHOTOS.map((p, i) => ({ url: p.src, alt: p.alt, order: i })),
  });

  // Registry items.
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

  // Invited guests. `identifier` maps to the ?guest= link param and
  // `accessCode` maps to the ?code= link param. Everyone shares one access
  // code for now; the identifier personalizes each invite.
  const CODE = VALID_ACCESS_CODES[0]; // "love2026"
  const GUESTS: { identifier: string; name: string; plusOne?: boolean }[] = [
    { identifier: "elliot_bourgeous", name: "Elliot Bourgeous" },
    { identifier: "isaiah_stinnett", name: "Isaiah Stinnett" },
    { identifier: "bennett_greene", name: "Bennett Greene", plusOne: true },
    { identifier: "liam_cronin", name: "Liam Cronin", plusOne: true },
    { identifier: "magic", name: "Magic" },
    { identifier: "ruth_geiger", name: "Ruth Geiger" },
    { identifier: "lydia_burrell", name: "Lydia Burrell" },
    { identifier: "julie_ann_peterson", name: "Julie Ann Peterson", plusOne: true },
    { identifier: "jansey_brewer", name: "Jansey Brewer" },
    { identifier: "mary_ruple", name: "Mary Ruple" },
    { identifier: "elizabeth_jackson", name: "Elizabeth Jackson" },
    { identifier: "maris_morton", name: "Maris Morton", plusOne: true },
    { identifier: "emmaline_hodson", name: "Emmaline Hodson" },
    { identifier: "brooke_elam", name: "Brooke Elam" },
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
  ];

  await prisma.guest.deleteMany();
  await prisma.guest.createMany({
    data: GUESTS.map((g) => ({
      identifier: g.identifier,
      name: g.name,
      accessCode: CODE,
      plusOne: g.plusOne ?? false,
    })),
  });

  console.log(`Seed complete: wedding, partners, photos, registry, ${GUESTS.length} guests.`);
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (err) => {
    console.error(err);
    await prisma.$disconnect();
    process.exit(1);
  });
