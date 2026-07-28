"use server";

/**
 * Admin-only CRUD server actions for registry gifts.
 *
 * Every action re-checks the admin session server-side (getAdminSession),
 * because Server Actions are reachable by direct POST — render-time gating on
 * the dashboard is not a security boundary. Only emails on the ADMIN_EMAILS
 * allowlist (isAdmin) may create, edit, or delete gifts.
 *
 * Guest-facing claim/release lives in lib/registry-actions.ts; this module is
 * strictly the couple's management surface.
 */

import { revalidatePath } from "next/cache";
import { getAdminSession } from "@/lib/admin";

export interface RegistryItemInput {
  title: string;
  description: string;
  category: string;
  /** External product/contribution link. Empty string is treated as null. */
  url?: string | null;
  /** Whole-dollar price. Converted to cents for storage. Null for funds. */
  priceDollars?: number | null;
  note?: string | null;
  /** Open-ended contribution fund (never claimable). */
  isFund?: boolean;
}

export interface RegistryActionResult {
  ok: boolean;
  id?: string;
  error?: string;
  /** True when the caller isn't an authorized admin. */
  forbidden?: boolean;
}

/** Trim a string field to null when empty. */
function clean(value: string | null | undefined): string | null {
  if (value == null) return null;
  const trimmed = value.trim();
  return trimmed.length === 0 ? null : trimmed;
}

/** Validate + normalize shared input for create/update. */
function normalize(input: RegistryItemInput):
  | { ok: true; data: NormalizedItem }
  | { ok: false; error: string } {
  const title = clean(input.title);
  const description = clean(input.description);
  const category = clean(input.category);

  if (!title) return { ok: false, error: "A title is required." };
  if (!description) return { ok: false, error: "A description is required." };
  if (!category) return { ok: false, error: "A category is required." };

  const isFund = Boolean(input.isFund);

  // Funds are open-ended, so they never carry a price.
  let priceCents: number | null = null;
  if (!isFund && input.priceDollars != null && !Number.isNaN(input.priceDollars)) {
    if (input.priceDollars < 0) return { ok: false, error: "Price can't be negative." };
    priceCents = Math.round(input.priceDollars * 100);
  }

  return {
    ok: true,
    data: {
      title,
      description,
      category,
      url: clean(input.url),
      note: clean(input.note),
      isFund,
      priceCents,
    },
  };
}

interface NormalizedItem {
  title: string;
  description: string;
  category: string;
  url: string | null;
  note: string | null;
  isFund: boolean;
  priceCents: number | null;
}

/** Revalidate every route that renders registry data. */
function revalidateRegistry() {
  revalidatePath("/registry");
  revalidatePath("/");
  revalidatePath("/dashboard");
}

/** Create a new registry gift. Appended after the current last item. */
export async function createRegistryItem(
  input: RegistryItemInput,
): Promise<RegistryActionResult> {
  const admin = await getAdminSession();
  if (!admin.isAdmin) {
    return { ok: false, forbidden: true, error: "Not authorized." };
  }

  const result = normalize(input);
  if (!result.ok) return { ok: false, error: result.error };

  const { prisma } = await import("@/lib/prisma");
  try {
    const last = await prisma.registryItem.findFirst({ orderBy: { order: "desc" } });
    const order = (last?.order ?? -1) + 1;

    const created = await prisma.registryItem.create({
      data: { ...result.data, order },
    });

    revalidateRegistry();
    return { ok: true, id: created.id };
  } catch {
    return { ok: false, error: "Couldn't save the gift. Please try again." };
  }
}

/** Update an existing registry gift by id. */
export async function updateRegistryItem(
  id: string,
  input: RegistryItemInput,
): Promise<RegistryActionResult> {
  const admin = await getAdminSession();
  if (!admin.isAdmin) {
    return { ok: false, forbidden: true, error: "Not authorized." };
  }
  if (typeof id !== "string" || id.length === 0) {
    return { ok: false, error: "Missing gift id." };
  }

  const result = normalize(input);
  if (!result.ok) return { ok: false, error: result.error };

  const { prisma } = await import("@/lib/prisma");
  try {
    // If an item is turned into a fund, any existing claim no longer applies.
    const data = result.data.isFund
      ? { ...result.data, purchased: false, claimedById: null, purchasedAt: null }
      : result.data;

    await prisma.registryItem.update({ where: { id }, data });

    revalidateRegistry();
    return { ok: true, id };
  } catch {
    return { ok: false, error: "Couldn't update the gift. Please try again." };
  }
}

/** Permanently delete a registry gift by id. */
export async function deleteRegistryItem(id: string): Promise<RegistryActionResult> {
  const admin = await getAdminSession();
  if (!admin.isAdmin) {
    return { ok: false, forbidden: true, error: "Not authorized." };
  }
  if (typeof id !== "string" || id.length === 0) {
    return { ok: false, error: "Missing gift id." };
  }

  const { prisma } = await import("@/lib/prisma");
  try {
    await prisma.registryItem.delete({ where: { id } });
    revalidateRegistry();
    return { ok: true, id };
  } catch {
    return { ok: false, error: "Couldn't delete the gift. Please try again." };
  }
}
