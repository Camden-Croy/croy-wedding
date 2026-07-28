"use server";

/**
 * Server actions for the gift registry "claim / release" mechanism.
 *
 * Two kinds of actor may give, resolved server-side from getAccess():
 *   - an invited guest (session cookie)      → claim recorded via `claimedById`
 *   - an identified email giver (giver cookie) → claim recorded via `claimedByEmail`
 * Anonymous visitors cannot claim.
 *
 * Claiming and releasing are race-safe conditional `updateMany`s:
 *   - claim only succeeds on an item unclaimed by anyone
 *   - release only succeeds for the actor who owns the claim
 *
 * Persists to `RegistryItem` and revalidates the registry route + home page.
 */

import { revalidatePath } from "next/cache";
import { getAccess } from "@/lib/access";

export interface ClaimResult {
  ok: boolean;
  /** True when the item was already claimed by someone else (not an error). */
  alreadyClaimed?: boolean;
  /** True when the visitor has no way to give (must identify or use invite link). */
  unauthenticated?: boolean;
  error?: string;
}

export async function setRegistryItemPurchased(
  id: string,
  purchased: boolean,
): Promise<ClaimResult> {
  if (typeof id !== "string" || id.length === 0) {
    return { ok: false, error: "Missing gift id." };
  }

  // Actor identity comes from verified cookies, never from the client.
  const access = await getAccess();
  if (!access.canGive) {
    return {
      ok: false,
      unauthenticated: true,
      error: "Tell us who you are before giving a gift.",
    };
  }

  const { prisma } = await import("@/lib/prisma");

  try {
    const item = await prisma.registryItem.findUnique({ where: { id } });
    if (!item) return { ok: false, error: "We couldn't find that gift." };
    if (item.isFund) {
      return { ok: false, error: "Contribution funds can't be marked as claimed." };
    }

    if (purchased) {
      // Race-safe claim: only an item unclaimed by anyone can be flipped.
      const data =
        access.tier === "invited"
          ? { purchased: true, claimedById: access.guest!.id, purchasedAt: new Date() }
          : {
              purchased: true,
              claimedByEmail: access.giverEmail,
              claimedByName: access.giverName,
              purchasedAt: new Date(),
            };
      const claimed = await prisma.registryItem.updateMany({
        where: { id, claimedById: null, claimedByEmail: null },
        data,
      });
      if (claimed.count === 0) {
        return { ok: false, alreadyClaimed: true };
      }
    } else {
      // Race-safe release: only the owning actor can release, enforced by the
      // where-clause (guest id or giver email), not a read-then-write check.
      const where =
        access.tier === "invited"
          ? { id, claimedById: access.guest!.id }
          : { id, claimedByEmail: access.giverEmail };
      const released = await prisma.registryItem.updateMany({
        where,
        data: {
          purchased: false,
          claimedById: null,
          claimedByEmail: null,
          claimedByName: null,
          purchasedAt: null,
        },
      });
      if (released.count === 0) {
        return { ok: false, error: "Only the person who claimed this gift can release it." };
      }
    }

    revalidatePath("/registry");
    revalidatePath("/");
    return { ok: true };
  } catch {
    return { ok: false, error: "We couldn't reach the registry just now. Please try again." };
  }
}
