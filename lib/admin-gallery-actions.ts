"use server";

/**
 * Admin-only CRUD server actions for the public photo gallery (the `Photo`
 * model). The couple uploads captioned photos here and they render on the
 * public /gallery page (and the homepage featured preview).
 *
 * Like the story actions, every action re-checks the admin session
 * server-side (getAdminSession) — Server Actions are reachable by direct POST,
 * so render-time gating on the dashboard is not a security boundary. Only
 * emails on the ADMIN_EMAILS allowlist (isAdmin) may create, edit, or delete.
 *
 * The image bytes are uploaded straight from the browser to Vercel Blob (see
 * app/api/blob/upload/route.ts); these actions only persist the resulting blob
 * URL + caption. Deleting a photo also removes its blob object.
 */

import { revalidatePath } from "next/cache";
import { getAdminSession } from "@/lib/admin";

export interface GalleryPhotoInput {
  /** Public Vercel Blob URL returned by the client upload. */
  imageUrl: string;
  /** Optional caption shown in the gallery. Empty string is stored as null. */
  caption?: string | null;
}

export interface GalleryActionResult {
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

/** A blob URL must belong to Vercel Blob — guards against arbitrary values. */
function isBlobUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return url.protocol === "https:" && url.hostname.endsWith(".public.blob.vercel-storage.com");
  } catch {
    return false;
  }
}

/** Revalidate every route that renders gallery photos. */
function revalidateGallery() {
  revalidatePath("/");
  revalidatePath("/gallery");
  revalidatePath("/dashboard");
}

/** Create a gallery photo, appended after the current last one. */
export async function createGalleryPhoto(
  input: GalleryPhotoInput,
): Promise<GalleryActionResult> {
  const admin = await getAdminSession();
  if (!admin.isAdmin) {
    return { ok: false, forbidden: true, error: "Not authorized." };
  }

  const imageUrl = clean(input.imageUrl);
  if (!imageUrl || !isBlobUrl(imageUrl)) {
    return { ok: false, error: "An uploaded image is required." };
  }
  const caption = clean(input.caption);

  const { prisma } = await import("@/lib/prisma");
  try {
    const last = await prisma.photo.findFirst({ orderBy: { order: "desc" } });
    const order = (last?.order ?? -1) + 1;

    const created = await prisma.photo.create({
      data: {
        url: imageUrl,
        // Alt text drives accessibility; fall back to a generic label.
        alt: caption ?? "Wedding photo",
        caption,
        order,
      },
    });

    revalidateGallery();
    return { ok: true, id: created.id };
  } catch {
    return { ok: false, error: "Couldn't save the photo. Please try again." };
  }
}

/**
 * Update a gallery photo by id. `imageUrl` may be unchanged (caption-only edit)
 * or a newly uploaded blob URL. When the image changes, the previously stored
 * blob is deleted.
 */
export async function updateGalleryPhoto(
  id: string,
  input: GalleryPhotoInput,
): Promise<GalleryActionResult> {
  const admin = await getAdminSession();
  if (!admin.isAdmin) {
    return { ok: false, forbidden: true, error: "Not authorized." };
  }
  if (typeof id !== "string" || id.length === 0) {
    return { ok: false, error: "Missing photo id." };
  }
  const imageUrl = clean(input.imageUrl);
  if (!imageUrl || !isBlobUrl(imageUrl)) {
    return { ok: false, error: "An uploaded image is required." };
  }
  const caption = clean(input.caption);

  const { prisma } = await import("@/lib/prisma");
  try {
    const existing = await prisma.photo.findUnique({ where: { id } });
    if (!existing) {
      return { ok: false, error: "That photo no longer exists." };
    }

    await prisma.photo.update({
      where: { id },
      data: { url: imageUrl, alt: caption ?? "Wedding photo", caption },
    });

    // If the image was replaced, clean up the old blob (best effort).
    if (existing.url !== imageUrl && isBlobUrl(existing.url)) {
      try {
        const { del } = await import("@vercel/blob");
        await del(existing.url);
      } catch {
        // A dangling blob is harmless; don't fail the update over it.
      }
    }

    revalidateGallery();
    return { ok: true, id };
  } catch {
    return { ok: false, error: "Couldn't update the photo. Please try again." };
  }
}

/** Permanently delete a gallery photo by id, including its blob object. */
export async function deleteGalleryPhoto(id: string): Promise<GalleryActionResult> {
  const admin = await getAdminSession();
  if (!admin.isAdmin) {
    return { ok: false, forbidden: true, error: "Not authorized." };
  }
  if (typeof id !== "string" || id.length === 0) {
    return { ok: false, error: "Missing photo id." };
  }

  const { prisma } = await import("@/lib/prisma");
  try {
    const existing = await prisma.photo.findUnique({ where: { id } });
    if (!existing) {
      // Already gone — treat as success so the UI settles.
      revalidateGallery();
      return { ok: true, id };
    }

    await prisma.photo.delete({ where: { id } });

    if (isBlobUrl(existing.url)) {
      try {
        const { del } = await import("@vercel/blob");
        await del(existing.url);
      } catch {
        // A dangling blob is harmless; the DB row is already gone.
      }
    }

    revalidateGallery();
    return { ok: true, id };
  } catch {
    return { ok: false, error: "Couldn't delete the photo. Please try again." };
  }
}

/**
 * Persist a new left-to-right, top-to-bottom order for the gallery. `orderedIds`
 * is the full list of photo ids in their desired reading order; each photo's
 * `order` is set to its index. Ids not present are left untouched. Runs in a
 * single transaction so the grid never ends up half-reordered.
 */
export async function reorderGalleryPhotos(
  orderedIds: string[],
): Promise<GalleryActionResult> {
  const admin = await getAdminSession();
  if (!admin.isAdmin) {
    return { ok: false, forbidden: true, error: "Not authorized." };
  }
  if (
    !Array.isArray(orderedIds) ||
    orderedIds.some((id) => typeof id !== "string" || id.length === 0)
  ) {
    return { ok: false, error: "Invalid photo order." };
  }

  const { prisma } = await import("@/lib/prisma");
  try {
    await prisma.$transaction(
      orderedIds.map((id, index) =>
        prisma.photo.update({ where: { id }, data: { order: index } }),
      ),
    );

    revalidateGallery();
    return { ok: true };
  } catch {
    return { ok: false, error: "Couldn't save the new order. Please try again." };
  }
}
