"use server";

/**
 * Admin-only CRUD server actions for invited guests (and their RSVP overrides).
 *
 * Every action re-checks the admin session server-side (getAdminSession),
 * because Server Actions are reachable by direct POST — render-time gating on
 * the dashboard is not a security boundary. Only emails on the ADMIN_EMAILS
 * allowlist (isAdmin) may create, edit, or delete guests.
 *
 * Guest-facing RSVP submission lives in lib/rsvp-actions.ts; this module is the
 * couple's management surface, including recording RSVPs on a guest's behalf
 * (e.g. for phone/text replies).
 */

import { revalidatePath } from "next/cache";
import { getAdminSession } from "@/lib/admin";
import { VALID_ACCESS_CODES } from "@/lib/content";
import { slugifyIdentifier } from "@/lib/guest";

/** Admin-facing RSVP state. "awaiting" means no response recorded. */
export type AdminRsvpState = "awaiting" | "attending" | "declined";

export interface GuestInput {
  name: string;
  /** URL-safe identifier used in the ?guest= link param. */
  identifier: string;
  accessCode: string;
  plusOne: boolean;
  /** Admin RSVP override. */
  rsvp: AdminRsvpState;
  /** Whether the guest is bringing their plus-one (only when plusOne + attending). */
  bringingGuest: boolean;
}

export interface GuestActionResult {
  ok: boolean;
  id?: string;
  error?: string;
  /** True when the caller isn't an authorized admin. */
  forbidden?: boolean;
}

/** Trim a string to null when empty. */
function clean(value: string | null | undefined): string | null {
  if (value == null) return null;
  const trimmed = value.trim();
  return trimmed.length === 0 ? null : trimmed;
}

interface NormalizedGuest {
  name: string;
  identifier: string;
  accessCode: string;
  plusOne: boolean;
  rsvp: AdminRsvpState;
  bringingGuest: boolean;
}

function normalize(
  input: GuestInput,
): { ok: true; data: NormalizedGuest } | { ok: false; error: string } {
  const name = clean(input.name);
  if (!name) return { ok: false, error: "A name is required." };

  // Derive the identifier from the name when the admin leaves it blank.
  const rawIdentifier = clean(input.identifier) ?? name;
  const identifier = slugifyIdentifier(rawIdentifier);
  if (!identifier) {
    return { ok: false, error: "Couldn't build an identifier. Use letters or numbers." };
  }

  const accessCode = clean(input.accessCode) ?? VALID_ACCESS_CODES[0];
  if (!VALID_ACCESS_CODES.includes(accessCode)) {
    return {
      ok: false,
      error: `Access code must be one of: ${VALID_ACCESS_CODES.join(", ")}.`,
    };
  }

  const rsvp: AdminRsvpState =
    input.rsvp === "attending" || input.rsvp === "declined" ? input.rsvp : "awaiting";

  return {
    ok: true,
    data: {
      name,
      identifier,
      accessCode,
      plusOne: Boolean(input.plusOne),
      rsvp,
      bringingGuest: Boolean(input.bringingGuest),
    },
  };
}

function revalidateGuests() {
  revalidatePath("/dashboard");
  revalidatePath("/");
}

/**
 * Sync a guest's RSVP row to the admin-chosen state. "awaiting" removes any
 * existing RSVP; otherwise upserts with a headcount derived from the plus-one.
 */
async function syncRsvp(
  prisma: typeof import("@/lib/prisma").prisma,
  guestId: string,
  data: NormalizedGuest,
) {
  if (data.rsvp === "awaiting") {
    await prisma.rsvp.deleteMany({ where: { guestId } });
    return;
  }
  const attending = data.rsvp === "attending";
  const bringing = data.plusOne && attending && data.bringingGuest;
  const guestCount = bringing ? 2 : 1;
  await prisma.rsvp.upsert({
    where: { guestId },
    create: { guestId, attending, guestCount },
    update: { attending, guestCount },
  });
}

/** Create a new invited guest (plus an optional RSVP override). */
export async function createGuest(input: GuestInput): Promise<GuestActionResult> {
  const admin = await getAdminSession();
  if (!admin.isAdmin) return { ok: false, forbidden: true, error: "Not authorized." };

  const result = normalize(input);
  if (!result.ok) return { ok: false, error: result.error };

  const { prisma } = await import("@/lib/prisma");
  try {
    const existing = await prisma.guest.findUnique({
      where: { identifier: result.data.identifier },
    });
    if (existing) {
      return { ok: false, error: `The identifier "${result.data.identifier}" is already taken.` };
    }

    const created = await prisma.guest.create({
      data: {
        name: result.data.name,
        identifier: result.data.identifier,
        accessCode: result.data.accessCode,
        plusOne: result.data.plusOne,
      },
    });
    await syncRsvp(prisma, created.id, result.data);

    revalidateGuests();
    return { ok: true, id: created.id };
  } catch {
    return { ok: false, error: "Couldn't save the guest. Please try again." };
  }
}

/** Update an existing guest by id. */
export async function updateGuest(id: string, input: GuestInput): Promise<GuestActionResult> {
  const admin = await getAdminSession();
  if (!admin.isAdmin) return { ok: false, forbidden: true, error: "Not authorized." };
  if (typeof id !== "string" || id.length === 0) {
    return { ok: false, error: "Missing guest id." };
  }

  const result = normalize(input);
  if (!result.ok) return { ok: false, error: result.error };

  const { prisma } = await import("@/lib/prisma");
  try {
    // Guard the unique identifier against collisions with a different guest.
    const clash = await prisma.guest.findUnique({
      where: { identifier: result.data.identifier },
    });
    if (clash && clash.id !== id) {
      return { ok: false, error: `The identifier "${result.data.identifier}" is already taken.` };
    }

    await prisma.guest.update({
      where: { id },
      data: {
        name: result.data.name,
        identifier: result.data.identifier,
        accessCode: result.data.accessCode,
        plusOne: result.data.plusOne,
      },
    });
    await syncRsvp(prisma, id, result.data);

    revalidateGuests();
    return { ok: true, id };
  } catch {
    return { ok: false, error: "Couldn't update the guest. Please try again." };
  }
}

/** Permanently delete a guest by id. Their RSVP (if any) cascades away. */
export async function deleteGuest(id: string): Promise<GuestActionResult> {
  const admin = await getAdminSession();
  if (!admin.isAdmin) return { ok: false, forbidden: true, error: "Not authorized." };
  if (typeof id !== "string" || id.length === 0) {
    return { ok: false, error: "Missing guest id." };
  }

  const { prisma } = await import("@/lib/prisma");
  try {
    await prisma.guest.delete({ where: { id } });
    revalidateGuests();
    return { ok: true, id };
  } catch {
    return { ok: false, error: "Couldn't delete the guest. Please try again." };
  }
}
