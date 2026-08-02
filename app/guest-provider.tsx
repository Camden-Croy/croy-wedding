"use client";

import {
  createContext,
  Suspense,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  deriveGuestName,
  hasSeenReveal,
  isValidAccessCode,
  isValidParam,
  markRevealSeen,
  type GuestSession,
} from "@/lib/guest";
import {
  establishSession,
  getServerSnapshot,
  getSnapshot,
  subscribe,
} from "@/lib/guest-store";
import { establishGuestSession } from "@/lib/guest-actions";
import { InviteReveal, type RevealState } from "@/components/invite-reveal";

interface GuestContextValue {
  /** Active session, or null when the guest is unauthorized / non-personalized. */
  session: GuestSession | null;
  /** Display name derived from the identifier, or null when none can be derived. */
  name: string | null;
}

const GuestContext = createContext<GuestContextValue>({ session: null, name: null });

export function useGuest(): GuestContextValue {
  return useContext(GuestContext);
}

/**
 * Reads the `?guest`/`?code` params and, when valid, establishes the client
 * display session + the server httpOnly session cookie.
 *
 * This is deliberately isolated from the surrounding content: it lives in its
 * own Suspense boundary (required by `useSearchParams`) and never suspends on
 * data, so a `router.refresh()` that re-suspends the page's server components
 * cannot unmount it. Keeping it mounted preserves `serverSessionRequested`,
 * which is what prevents an infinite establish → refresh → establish loop.
 */
function GuestParamsSync({ onReveal }: { onReveal: (reveal: RevealState) => void }) {
  const searchParams = useSearchParams();
  const router = useRouter();
  // Guards the one-time server-session establishment for this mount.
  const serverSessionRequested = useRef(false);

  useEffect(() => {
    const guest = searchParams.get("guest");
    const code = searchParams.get("code");

    // Establish a session only when both params are present, valid length,
    // and the code is a recognized access code (Req 1.1, 1.2, 1.4).
    // Empty/oversized/partial/missing params are ignored so any stored
    // session is retained (Req 1.3, 1.5, 2.5, 2.6).
    const valid = isValidParam(guest) && isValidParam(code) && isValidAccessCode(code);
    const willReveal = valid && !hasSeenReveal(guest as string);

    if (valid) {
      // Client-side display session (personalized greeting, name).
      establishSession({ guest, code });

      // First-open envelope reveal: play once per guest on this device. Gated
      // by localStorage so returning visits / bookmarked links skip straight to
      // the site. Marked seen immediately so effect re-runs don't replay it.
      if (willReveal) {
        markRevealSeen(guest);
        onReveal({ name: deriveGuestName(guest) });
      }

      // Server-side identity: set the httpOnly cookie once so Server Actions and
      // Server Components (e.g. the registry) can authorize this guest. Refresh
      // afterward so any already-rendered server view picks up the new session.
      if (!serverSessionRequested.current) {
        serverSessionRequested.current = true;
        establishGuestSession(guest, code).then((res) => {
          if (res.ok) router.refresh();
        });
      }
    }

    // If we won't play the reveal, drop the pre-paint cover (added by the inline
    // script in app/layout) so the site is visible. When we DO reveal, the
    // overlay itself removes the cover once it has mounted opaque on top.
    if (!willReveal && typeof document !== "undefined") {
      document.documentElement.classList.remove("invite-pending");
    }
  }, [searchParams, router, onReveal]);

  return null;
}

export function GuestProvider({ children }: { children: React.ReactNode }) {
  // Reads localStorage on the client without a hydration mismatch (server snapshot is null).
  const session = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  // null = no reveal; an object = the first-open envelope reveal is showing.
  const [reveal, setReveal] = useState<RevealState | null>(null);
  const handleReveal = useCallback((next: RevealState) => setReveal(next), []);

  const value = useMemo<GuestContextValue>(
    () => ({ session, name: session ? deriveGuestName(session.guest) : null }),
    [session],
  );

  return (
    <GuestContext.Provider value={value}>
      {/* useSearchParams requires a Suspense boundary during prerender. Scoping
          it to this tiny, data-free child keeps the param sync mounted across
          router.refresh() so it doesn't re-fire. */}
      <Suspense fallback={null}>
        <GuestParamsSync onReveal={handleReveal} />
      </Suspense>
      {children}
      <InviteReveal reveal={reveal} onClose={() => setReveal(null)} />
    </GuestContext.Provider>
  );
}
