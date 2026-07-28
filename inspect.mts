import "dotenv/config";
import { PrismaClient } from "./lib/generated/prisma/client";
import { PrismaNeon } from "@prisma/adapter-neon";
const adapter = new PrismaNeon({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });
prisma.registryItem
  .findMany({ orderBy: { order: "asc" }, select: { title: true, purchased: true, claimedById: true, claimedByEmail: true, isFund: true } })
  .then((rows) => {
    for (const r of rows)
      console.log(
        `${r.purchased ? "P" : "."} id=${r.claimedById ?? "-"} email=${r.claimedByEmail ?? "-"} fund=${r.isFund ? "Y" : "n"}  ${r.title}`,
      );
    return prisma.$disconnect();
  })
  .catch((e) => { console.log("ERR", e.message); process.exit(1); });
