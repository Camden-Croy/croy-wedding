"use server";

/**
 * RSVP submission for invited guests.
 *
 * The guest is resolved from the httpOnly session cookie (getSessionGuest),
 * never from a client-supplied identifier — a visitor can only RSVP as
 * themselves. Party size is derived server-side from the invitation: a
 * plus-one only counts when the couple granted one AND the guest is both
 * attending and choosing to bring someone. This keeps the dashboard headcount
 * honest (see summarizeRsvps in lib/data.ts).
 */

import { revalidatePath } from "next/cache";
import { getSessionGuest } from "@/lib/guest-session";

export interface RsvpInput {
  attending: boolean;
  /** Whether the guest is bringing their plus-one. Ignored unless the
   *  invitation includes one and they're attending. */
  bringingGuest?: boolean;
  message?: string | null;
}

export interface RsvpResult {
  ok: boolean;
  error?: string;
}

export async function submitRsvp(input: RsvpInput): Promise<RsvpResult> {
  const guest = await getSessionGuest();
  if (!guest) {
    return {
      ok: false,
      error: "We couldn't verify your invitation. Open your personal link and try again.",
    };
  }

  // A plus-one only adds to the headcount when the invitation allows it and the
  // guest is attending with a guest in tow.
  const bringing = Boolean(guest.plusOne && input.attending && input.bringingGuest);
  const guestCount = bringing ? 2 : 1;
  const message = input.message?.trim() ? input.message.trim() : null;

  const { prisma } = await import("@/lib/prisma");
  try {
    await prisma.rsvp.upsert({
      where: { guestId: guest.id },
      create: {
        guestId: guest.id,
        attending: input.attending,
        guestCount,
        message,
      },
      update: {
        attending: input.attending,
        guestCount,
        message,
      },
    });
  } catch {
    return { ok: false, error: "Couldn't save your RSVP. Please try again." };
  }

  // The home page (guest view) and the admin dashboard both render RSVP data.
  revalidatePath("/");
  revalidatePath("/dashboard");
  return { ok: true };
}
