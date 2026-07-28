import { headers } from "next/headers";
import { auth } from "@/lib/auth";

/** Parse ADMIN_EMAILS into a normalized allowlist. */
function adminEmails(): string[] {
  return (process.env.ADMIN_EMAILS ?? "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter((e) => e.length > 0);
}

export interface AdminSession {
  signedIn: boolean;
  isAdmin: boolean;
  email: string | null;
  name: string | null;
}

/**
 * Resolve the current admin session for a Server Component / action.
 *
 * Anyone can sign in with Google, but only emails on the ADMIN_EMAILS allowlist
 * are treated as admins. Everything sensitive (guest names, RSVP details) must
 * be gated on `isAdmin`, never merely on `signedIn`.
 */
export async function getAdminSession(): Promise<AdminSession> {
  const session = await auth.api.getSession({ headers: await headers() });
  const user = session?.user;
  if (!user?.email) {
    return { signedIn: false, isAdmin: false, email: null, name: null };
  }
  const isAdmin = adminEmails().includes(user.email.toLowerCase());
  return { signedIn: true, isAdmin, email: user.email, name: user.name ?? null };
}
