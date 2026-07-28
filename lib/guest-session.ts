import { cache } from "react";
import { cookies } from "next/headers";
import { findInvitedGuest } from "@/lib/data";

/**
 * Server-side guest identity.
 *
 * The browser holds an httpOnly cookie with the guest's link credentials
 * (`identifier` + `accessCode`). We never trust the cookie on its own — every
 * read re-validates it against the `Guest` table, so a forged/edited cookie is
 * worthless without real credentials. This is the server counterpart to the
 * client-only display session in app/guest-provider.tsx.
 */

export const GUEST_COOKIE = "croy_guest";

/** One year — invitations are valid through the wedding. */
export const GUEST_COOKIE_MAX_AGE = 60 * 60 * 24 * 365;

export interface GuestCookiePayload {
  guest: string;
  code: string;
}

/** Parse the raw cookie value into credentials, or null when malformed. */
export function parseGuestCookie(raw: string | undefined): GuestCookiePayload | null {
  if (!raw) return null;
  try {
    const parsed: unknown = JSON.parse(raw);
    if (
      typeof parsed === "object" &&
      parsed !== null &&
      typeof (parsed as GuestCookiePayload).guest === "string" &&
      typeof (parsed as GuestCookiePayload).code === "string"
    ) {
      return { guest: (parsed as GuestCookiePayload).guest, code: (parsed as GuestCookiePayload).code };
    }
  } catch {
    /* fall through */
  }
  return null;
}

/**
 * The invited guest for the current request, or null when there is no valid
 * session. Memoized per request via React `cache` so multiple callers (page +
 * server action) share a single DB lookup.
 */
export const getSessionGuest = cache(async () => {
  const store = await cookies();
  const creds = parseGuestCookie(store.get(GUEST_COOKIE)?.value);
  if (!creds) return null;
  try {
    return await findInvitedGuest(creds.guest, creds.code);
  } catch {
    // Database unreachable — treat as no session rather than throwing.
    return null;
  }
});
