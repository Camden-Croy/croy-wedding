import { cache } from "react";
import { cookies } from "next/headers";
import { getSessionGuest } from "@/lib/guest-session";

/** The guest record shape returned by the session helper. */
type SessionGuest = NonNullable<Awaited<ReturnType<typeof getSessionGuest>>>;

/**
 * Visitor access tiers.
 *
 *  - "invited"    → a verified guest session (httpOnly `croy_guest`, validated
 *                   against the Guest table). Unlocks personal details + claiming.
 *  - "identified" → a self-declared email giver (httpOnly `croy_giver`). Can give
 *                   (claim / contribute); email is attribution, NOT authentication,
 *                   so it must never unlock private info.
 *  - "public"     → anonymous. Sees only public content.
 */
export type Tier = "invited" | "identified" | "public";

export const GIVER_COOKIE = "croy_giver";
export const GIVER_COOKIE_MAX_AGE = 60 * 60 * 24 * 365;

export interface GiverIdentity {
  email: string;
  name: string | null;
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

export function isValidEmail(email: string): boolean {
  const e = normalizeEmail(email);
  return e.length > 0 && e.length <= 254 && EMAIL_RE.test(e);
}

/** Parse the raw giver cookie value into an identity, or null when malformed. */
export function parseGiverCookie(raw: string | undefined): GiverIdentity | null {
  if (!raw) return null;
  try {
    const parsed: unknown = JSON.parse(raw);
    if (
      typeof parsed === "object" &&
      parsed !== null &&
      typeof (parsed as GiverIdentity).email === "string" &&
      isValidEmail((parsed as GiverIdentity).email)
    ) {
      const name = (parsed as GiverIdentity).name;
      return {
        email: normalizeEmail((parsed as GiverIdentity).email),
        name: typeof name === "string" && name.trim().length > 0 ? name.trim() : null,
      };
    }
  } catch {
    /* fall through */
  }
  return null;
}

/** The self-declared email giver for this request, or null. */
export const getGiverIdentity = cache(async (): Promise<GiverIdentity | null> => {
  const store = await cookies();
  return parseGiverCookie(store.get(GIVER_COOKIE)?.value);
});

export interface Access {
  tier: Tier;
  /** The invited guest, when tier === "invited". */
  guest: SessionGuest | null;
  /** The giver's email, when tier === "identified". */
  giverEmail: string | null;
  /** The giver's optional display name, when tier === "identified". */
  giverName: string | null;
  /** Whether this visitor may claim/contribute (invited or identified). */
  canGive: boolean;
}

/**
 * Resolve the current visitor's access tier for a Server Component / action.
 * Invited takes precedence over identified. Memoized per request.
 */
export const getAccess = cache(async (): Promise<Access> => {
  const guest = await getSessionGuest();
  if (guest) {
    return { tier: "invited", guest, giverEmail: null, giverName: null, canGive: true };
  }
  const giver = await getGiverIdentity();
  if (giver) {
    return {
      tier: "identified",
      guest: null,
      giverEmail: giver.email,
      giverName: giver.name,
      canGive: true,
    };
  }
  return { tier: "public", guest: null, giverEmail: null, giverName: null, canGive: false };
});
