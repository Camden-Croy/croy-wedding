"use client";

import {
  createContext,
  Suspense,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useSyncExternalStore,
} from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { deriveGuestName, isValidAccessCode, isValidParam, type GuestSession } from "@/lib/guest";
import {
  establishSession,
  getServerSnapshot,
  getSnapshot,
  subscribe,
} from "@/lib/guest-store";
import { establishGuestSession } from "@/lib/guest-actions";

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
function GuestParamsSync() {
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
    if (isValidParam(guest) && isValidParam(code) && isValidAccessCode(code)) {
      // Client-side display session (personalized greeting, name).
      establishSession({ guest, code });

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
  }, [searchParams, router]);

  return null;
}

export function GuestProvider({ children }: { children: React.ReactNode }) {
  // Reads localStorage on the client without a hydration mismatch (server snapshot is null).
  const session = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

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
        <GuestParamsSync />
      </Suspense>
      {children}
    </GuestContext.Provider>
  );
}
