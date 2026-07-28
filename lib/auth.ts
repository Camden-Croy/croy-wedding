import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { nextCookies } from "better-auth/next-js";
import { prisma } from "@/lib/prisma";

const googleConfigured = Boolean(
  process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET,
);

/**
 * Better Auth server instance for the admin area (Google OAuth only).
 *
 * Persists users/sessions/accounts via the Prisma adapter (see the Better Auth
 * models in prisma/schema.prisma). Anyone can complete Google sign-in, but
 * access to admin data is gated by an email allowlist — see lib/admin.ts.
 *
 * The Google provider is only registered when credentials are present so the
 * app still builds/runs before the OAuth client is configured.
 */
export const auth = betterAuth({
  database: prismaAdapter(prisma, { provider: "postgresql" }),
  socialProviders: googleConfigured
    ? {
        google: {
          clientId: process.env.GOOGLE_CLIENT_ID as string,
          clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
        },
      }
    : undefined,
  // Must be last: lets Server Actions set auth cookies in Next.js.
  plugins: [nextCookies()],
});
