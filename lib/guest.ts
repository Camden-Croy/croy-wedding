import { VALID_ACCESS_CODES } from "@/lib/content";

/** Persisted guest identity (Req 1 & 2). */
export interface GuestSession {
  guest: string;
  code: string;
}

export const GUEST_STORAGE_KEY = "croy-wedding:guest-session";

const MIN_LEN = 1;
const MAX_LEN = 256;

/** A query param value is usable only when non-empty and <= 256 chars (Req 1.1, 1.3). */
export function isValidParam(value: string | null | undefined): value is string {
  return typeof value === "string" && value.length >= MIN_LEN && value.length <= MAX_LEN;
}

/** Access code must be one of the configured codes (Req 1.4). Case-insensitive. */
export function isValidAccessCode(code: string): boolean {
  const normalized = code.trim().toLowerCase();
  return VALID_ACCESS_CODES.some((c) => c.toLowerCase() === normalized);
}

/**
 * Normalize a free-text name into a URL-safe guest identifier:
 * lowercase, with runs of non-alphanumeric characters collapsed to single
 * underscores. Shared by the admin guest manager (live preview) and the
 * admin server action (normalization) so both derive the same value.
 */
export function slugifyIdentifier(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

/**
 * Derive a display name from the guest identifier (Req 3.1, 3.5).
 * Returns null when no reasonable name can be derived.
 */
export function deriveGuestName(guest: string): string | null {
  const cleaned = guest
    .replace(/[_+]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  if (cleaned.length === 0) return null;

  return cleaned
    .split(" ")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

/** Read + parse the stored session, discarding malformed data (Req 2.7). */
export function loadSession(): GuestSession | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(GUEST_STORAGE_KEY);
    if (!raw) return null;
    const parsed: unknown = JSON.parse(raw);
    if (
      typeof parsed === "object" &&
      parsed !== null &&
      isValidParam((parsed as GuestSession).guest) &&
      isValidParam((parsed as GuestSession).code)
    ) {
      return { guest: (parsed as GuestSession).guest, code: (parsed as GuestSession).code };
    }
    // Malformed shape -> discard.
    window.localStorage.removeItem(GUEST_STORAGE_KEY);
    return null;
  } catch {
    // Unparseable -> discard (Req 2.7).
    try {
      window.localStorage.removeItem(GUEST_STORAGE_KEY);
    } catch {
      /* ignore */
    }
    return null;
  }
}

export function saveSession(session: GuestSession): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(GUEST_STORAGE_KEY, JSON.stringify(session));
  } catch {
    /* storage may be unavailable; personalization degrades gracefully */
  }
}

export function sameSession(a: GuestSession | null, b: GuestSession | null): boolean {
  return !!a && !!b && a.guest === b.guest && a.code === b.code;
}

/* ----------------------------------------------------------------------------
 * First-open invite reveal flag.
 *
 * The envelope reveal (app/invite-reveal.tsx) should play only the first time a
 * given guest opens their personal link on this device. We persist a per-guest
 * flag in localStorage so returning visits (or a bookmarked full link) skip it.
 * ------------------------------------------------------------------------- */
export const REVEAL_STORAGE_PREFIX = "croy-wedding:invite-revealed:";

/** Whether the envelope reveal has already played for this guest on this device. */
export function hasSeenReveal(guest: string): boolean {
  if (typeof window === "undefined") return true; // never reveal during SSR
  try {
    return window.localStorage.getItem(REVEAL_STORAGE_PREFIX + guest) === "1";
  } catch {
    // Storage unavailable — treat as seen so we never loop or block the page.
    return true;
  }
}

/** Remember that the reveal has played for this guest, so it won't replay. */
export function markRevealSeen(guest: string): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(REVEAL_STORAGE_PREFIX + guest, "1");
  } catch {
    /* storage may be unavailable; the reveal simply plays again next time */
  }
}
