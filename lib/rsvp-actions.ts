"use server";

/**
 * Ready-to-wire RSVP server action. This persists to the `Rsvp` model via the
 * `Guest` identifier. It's not called yet — the form uses a simulated submit
 * for the skeleton (see components/rsvp-form.tsx) so the UI works before the
 * Neon database is live. Swap the form over to this once you've migrated + seeded.
 */

export interface RsvpInput {
  guestIdentifier: string;
  attending: boolean;
  guestCount: number;
  message?: string;
}

export interface RsvpResult {
  ok: boolean;
  error?: string;
}

export async function submitRsvp(input: RsvpInput): Promise<RsvpResult> {
  // Lazy import so this module doesn't pull Prisma into places that don't need it.
  const { prisma } = await import("@/lib/prisma");

  const guest = await prisma.guest.findUnique({
    where: { identifier: input.guestIdentifier },
  });
  if (!guest) return { ok: false, error: "We couldn't find your invitation." };

  await prisma.rsvp.upsert({
    where: { guestId: guest.id },
    create: {
      guestId: guest.id,
      attending: input.attending,
      guestCount: input.guestCount,
      message: input.message,
    },
    update: {
      attending: input.attending,
      guestCount: input.guestCount,
      message: input.message,
    },
  });

  return { ok: true };
}
