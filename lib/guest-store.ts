import { loadSession, saveSession, sameSession, type GuestSession } from "@/lib/guest";

/**
 * A tiny external store for the guest session, consumed via `useSyncExternalStore`.
 *
 * Using an external store (rather than `useState` + effect) lets the client read
 * from `localStorage` without a hydration mismatch: `getServerSnapshot` returns
 * `null` so the server renders the non-personalized view, and React re-reads the
 * client snapshot after hydration.
 */

let loaded = false;
let snapshot: GuestSession | null = null;
const listeners = new Set<() => void>();

function emit(): void {
  for (const listener of listeners) listener();
}

export function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

/** Stable client snapshot — the same reference is returned until it changes. */
export function getSnapshot(): GuestSession | null {
  if (!loaded) {
    snapshot = loadSession();
    loaded = true;
  }
  return snapshot;
}

/** Server render (and hydration) always sees no session. */
export function getServerSnapshot(): GuestSession | null {
  return null;
}

/** Establish/replace the active session and persist it (Req 1.2, 2.3). No-op if unchanged (Req 2.4). */
export function establishSession(session: GuestSession): void {
  if (sameSession(snapshot, session)) return;
  snapshot = session;
  loaded = true;
  saveSession(session);
  emit();
}
