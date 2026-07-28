"use server";

/**
 * Server actions for the "identified giver" tier: a non-invited well-wisher who
 * wants to give through the registry. They self-declare an email (attribution
 * for thank-yous), which we store in an httpOnly cookie. This is NOT
 * authentication — it never unlocks private/invited content.
 */

import { cookies } from "next/headers";
import {
  GIVER_COOKIE,
  GIVER_COOKIE_MAX_AGE,
  isValidEmail,
  normalizeEmail,
} from "@/lib/access";

export interface IdentifyResult {
  ok: boolean;
  error?: string;
}

const MAX_NAME_LEN = 120;

/** Set the giver-identity cookie after validating the email. */
export async function identifyGiver(email: string, name?: string): Promise<IdentifyResult> {
  if (typeof email !== "string" || !isValidEmail(email)) {
    return { ok: false, error: "Please enter a valid email address." };
  }
  const cleanName =
    typeof name === "string" && name.trim().length > 0
      ? name.trim().slice(0, MAX_NAME_LEN)
      : null;

  const store = await cookies();
  store.set(GIVER_COOKIE, JSON.stringify({ email: normalizeEmail(email), name: cleanName }), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: GIVER_COOKIE_MAX_AGE,
  });
  return { ok: true };
}

/** Forget the giver identity. */
export async function clearGiver(): Promise<void> {
  const store = await cookies();
  store.delete(GIVER_COOKIE);
}
