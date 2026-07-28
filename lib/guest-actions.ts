"use server";

/**
 * Server actions that establish or clear the httpOnly guest-session cookie.
 * The cookie is only set after the credentials are verified against the
 * `Guest` table, so a session always corresponds to a real invited guest.
 */

import { cookies } from "next/headers";
import { findInvitedGuest } from "@/lib/data";
import { GUEST_COOKIE, GUEST_COOKIE_MAX_AGE } from "@/lib/guest-session";

export interface EstablishResult {
  ok: boolean;
  /** The guest's display name when the session was established. */
  name?: string;
}

/**
 * Validate a guest's link credentials and, on success, persist an httpOnly
 * session cookie. Called by the client GuestProvider when it sees valid
 * `?guest`/`?code` params.
 */
export async function establishGuestSession(
  identifier: string,
  code: string,
): Promise<EstablishResult> {
  if (typeof identifier !== "string" || typeof code !== "string") {
    return { ok: false };
  }

  let guest;
  try {
    guest = await findInvitedGuest(identifier, code);
  } catch {
    return { ok: false };
  }
  if (!guest) return { ok: false };

  const store = await cookies();
  store.set(GUEST_COOKIE, JSON.stringify({ guest: identifier, code }), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: GUEST_COOKIE_MAX_AGE,
  });

  return { ok: true, name: guest.name };
}

/** Forget the current guest session. */
export async function clearGuestSession(): Promise<void> {
  const store = await cookies();
  store.delete(GUEST_COOKIE);
}
