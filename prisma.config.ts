import "dotenv/config";
import { defineConfig, env } from "prisma/config";

// Prisma 7 configuration. CLI commands (migrate, db push, studio, seed) use the
// direct connection string here. The runtime client connects via the Neon
// adapter using the pooled DATABASE_URL (see lib/prisma.ts).
export default defineConfig({
  schema: "prisma/schema.prisma",
  datasource: {
    url: env("DIRECT_URL"),
  },
  migrations: {
    seed: "tsx prisma/seed.ts",
  },
});
