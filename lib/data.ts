import { prisma } from "@/lib/prisma";

/**
 * Server-side data access for the wedding site. Import these from Server
 * Components (or Server Actions) once your Neon database is live and seeded.
 * They replace the static placeholders in lib/content.ts.
 */

export function getWedding() {
  return prisma.wedding.findFirst();
}

export function getPartners() {
  return prisma.partner.findMany({ orderBy: { order: "asc" } });
}

export function getPhotos() {
  return prisma.photo.findMany({ orderBy: { order: "asc" }, take: 200 });
}

export function getRegistryItems() {
  return prisma.registryItem.findMany({ orderBy: { order: "asc" } });
}

/**
 * Photos for a given "Our Story" moment ("facetime" | "visits"), ordered for
 * display. Backs both the admin CRUD tabs and the public story carousel.
 */
export function getStoryPhotos(section: string) {
  return prisma.storyPhoto.findMany({
    where: { section },
    orderBy: { order: "asc" },
    take: 100,
  });
}

/**
 * Claimed registry gifts with the guest who claimed each — for the admin view
 * (thank-you notes). Guest identity is only ever exposed here, behind auth.
 */
export function getRegistryClaims() {
  return prisma.registryItem.findMany({
    where: { OR: [{ claimedById: { not: null } }, { claimedByEmail: { not: null } }] },
    orderBy: { purchasedAt: "desc" },
    include: { claimedBy: true },
  });
}

/**
 * Server-side access validation (Req 1.4). Moving the access-code check here
 * keeps valid codes out of the client bundle. Returns the guest when the
 * identifier + code match an invited guest, otherwise null.
 */
export async function findInvitedGuest(identifier: string, accessCode: string) {
  return prisma.guest.findFirst({
    where: { identifier, accessCode },
  });
}

/** Whether a given access code belongs to any invited guest. */
export async function isKnownAccessCode(accessCode: string): Promise<boolean> {
  const count = await prisma.guest.count({ where: { accessCode } });
  return count > 0;
}

/** A guest paired with their RSVP (if any), for the RSVP dashboard. */
export type GuestWithRsvp = Awaited<ReturnType<typeof getGuestsWithRsvps>>[number];

/**
 * All invited guests with their RSVP, ordered by name. Used by the RSVP
 * dashboard (/dashboard) so the couple can see who has responded.
 */
export function getGuestsWithRsvps() {
  return prisma.guest.findMany({
    orderBy: { name: "asc" },
    include: { rsvp: true },
  });
}

export type RsvpStatus = "attending" | "declined" | "awaiting";

/** Derive a single status from a guest's RSVP record. */
export function rsvpStatus(guest: { rsvp: { attending: boolean | null } | null }): RsvpStatus {
  if (!guest.rsvp || guest.rsvp.attending === null) return "awaiting";
  return guest.rsvp.attending ? "attending" : "declined";
}

export interface RsvpSummary {
  invited: number;
  attending: number;
  declined: number;
  awaiting: number;
  /** Total expected headcount from attending parties (sum of guestCount). */
  headcount: number;
}

/** Roll up guest RSVP records into dashboard summary counts. */
export function summarizeRsvps(guests: GuestWithRsvp[]): RsvpSummary {
  return guests.reduce<RsvpSummary>(
    (acc, guest) => {
      acc.invited += 1;
      const status = rsvpStatus(guest);
      if (status === "attending") {
        acc.attending += 1;
        acc.headcount += guest.rsvp?.guestCount ?? 1;
      } else if (status === "declined") {
        acc.declined += 1;
      } else {
        acc.awaiting += 1;
      }
      return acc;
    },
    { invited: 0, attending: 0, declined: 0, awaiting: 0, headcount: 0 },
  );
}
