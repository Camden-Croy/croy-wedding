/**
 * Shared, non-"use server" constants for the managed "Our Story" photo
 * sections. These live outside lib/admin-story-actions.ts because a "use
 * server" module may only export async functions — exporting a const/array from
 * it throws "A 'use server' file can only export async functions".
 */

/** The two story moments that have an admin-managed photo gallery. */
export const STORY_SECTIONS = ["facetime", "visits"] as const;
export type StorySection = (typeof STORY_SECTIONS)[number];

export function isStorySection(value: unknown): value is StorySection {
  return typeof value === "string" && (STORY_SECTIONS as readonly string[]).includes(value);
}
