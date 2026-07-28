"use server";

/**
 * Admin-only CRUD server actions for "Our Story" photos (the long-distance
 * FaceTime and Visits moments). One model backs both; `section` discriminates
 * which moment a photo belongs to.
 *
 * Like the registry actions, every action re-checks the admin session
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

/** The two story moments that have a managed photo gallery. */
export const STORY_SECTIONS = ["facetime", "visits"] as const;
export type StorySection = (typeof STORY_SECTIONS)[number];

export interface StoryPhotoInput {
  section: StorySection;
  /** Public Vercel Blob URL returned by the client upload. */
  imageUrl: string;
  /** Optional caption shown beneath the image. Empty string is stored as null. */
  caption?: string | null;
}

export interface StoryActionResult {
  ok: boolean;
  id?: string;
  error?: string;
  /** True when the caller isn't an authorized admin. */
  forbidden?: boolean;
}

function isSection(value: unknown): value is StorySection {
  return typeof value === "string" && (STORY_SECTIONS as readonly string[]).includes(value);
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

/** Revalidate every route that renders story photos. */
function revalidateStory() {
  revalidatePath("/");
  revalidatePath("/dashboard");
}

/** Create a new story photo, appended after the current last one in its section. */
export async function createStoryPhoto(input: StoryPhotoInput): Promise<StoryActionResult> {
  const admin = await getAdminSession();
  if (!admin.isAdmin) {
    return { ok: false, forbidden: true, error: "Not authorized." };
  }

  if (!isSection(input.section)) {
    return { ok: false, error: "Unknown section." };
  }
  const imageUrl = clean(input.imageUrl);
  if (!imageUrl || !isBlobUrl(imageUrl)) {
    return { ok: false, error: "An uploaded image is required." };
  }

  const { prisma } = await import("@/lib/prisma");
  try {
    const last = await prisma.storyPhoto.findFirst({
      where: { section: input.section },
      orderBy: { order: "desc" },
    });
    const order = (last?.order ?? -1) + 1;

    const created = await prisma.storyPhoto.create({
      data: {
        section: input.section,
        imageUrl,
        caption: clean(input.caption),
        order,
      },
    });

    revalidateStory();
    return { ok: true, id: created.id };
  } catch {
    return { ok: false, error: "Couldn't save the photo. Please try again." };
  }
}

/**
 * Update an existing story photo by id. `imageUrl` may be the same as before
 * (caption-only edit) or a newly uploaded blob URL. When the image changes, the
 * previously stored blob is deleted.
 */
export async function updateStoryPhoto(
  id: string,
  input: StoryPhotoInput,
): Promise<StoryActionResult> {
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

  const { prisma } = await import("@/lib/prisma");
  try {
    const existing = await prisma.storyPhoto.findUnique({ where: { id } });
    if (!existing) {
      return { ok: false, error: "That photo no longer exists." };
    }

    await prisma.storyPhoto.update({
      where: { id },
      data: { imageUrl, caption: clean(input.caption) },
    });

    // If the image was replaced, clean up the old blob (best effort).
    if (existing.imageUrl !== imageUrl && isBlobUrl(existing.imageUrl)) {
      try {
        const { del } = await import("@vercel/blob");
        await del(existing.imageUrl);
      } catch {
        // A dangling blob is harmless; don't fail the update over it.
      }
    }

    revalidateStory();
    return { ok: true, id };
  } catch {
    return { ok: false, error: "Couldn't update the photo. Please try again." };
  }
}

/** Permanently delete a story photo by id, including its blob object. */
export async function deleteStoryPhoto(id: string): Promise<StoryActionResult> {
  const admin = await getAdminSession();
  if (!admin.isAdmin) {
    return { ok: false, forbidden: true, error: "Not authorized." };
  }
  if (typeof id !== "string" || id.length === 0) {
    return { ok: false, error: "Missing photo id." };
  }

  const { prisma } = await import("@/lib/prisma");
  try {
    const existing = await prisma.storyPhoto.findUnique({ where: { id } });
    if (!existing) {
      // Already gone — treat as success so the UI settles.
      revalidateStory();
      return { ok: true, id };
    }

    await prisma.storyPhoto.delete({ where: { id } });

    if (isBlobUrl(existing.imageUrl)) {
      try {
        const { del } = await import("@vercel/blob");
        await del(existing.imageUrl);
      } catch {
        // A dangling blob is harmless; the DB row is already gone.
      }
    }

    revalidateStory();
    return { ok: true, id };
  } catch {
    return { ok: false, error: "Couldn't delete the photo. Please try again." };
  }
}
