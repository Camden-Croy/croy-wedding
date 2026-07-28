"use client";

import { useState } from "react";
import { Loader2, ShieldCheck } from "lucide-react";
import { PageTransition } from "@/components/page-transition";
import { signIn } from "@/lib/auth-client";

export default function AdminSignInPage() {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleGoogle() {
    setError(null);
    setPending(true);
    try {
      // Redirects to Google, then back to /dashboard via the OAuth callback.
      await signIn.social({ provider: "google", callbackURL: "/dashboard" });
    } catch {
      setError("Couldn't start Google sign-in. Please try again.");
      setPending(false);
    }
  }

  return (
    <PageTransition>
      <div className="mx-auto flex max-w-md flex-col items-center rounded-3xl border border-border bg-surface p-10 text-center shadow-sm">
        <span className="inline-flex size-12 items-center justify-center rounded-full bg-surface-2 text-accent">
          <ShieldCheck className="size-6" aria-hidden />
        </span>
        <h1 className="mt-5 font-serif text-3xl text-foreground">Admin sign in</h1>
        <p className="mt-2 text-sm text-muted">
          For Camden &amp; Jordan. Sign in with the Google account on the guest list to view RSVPs
          and gift claims.
        </p>

        <button
          onClick={handleGoogle}
          disabled={pending}
          className="mt-8 inline-flex w-full items-center justify-center gap-2 rounded-full border border-border bg-background px-5 py-3 text-sm font-medium text-foreground transition-colors hover:border-accent hover:text-accent-strong disabled:opacity-70"
        >
          {pending ? (
            <>
              <Loader2 className="size-4 animate-spin" aria-hidden /> Redirecting…
            </>
          ) : (
            <>
              <GoogleGlyph /> Continue with Google
            </>
          )}
        </button>

        {error ? <p className="mt-4 text-sm text-accent-strong">{error}</p> : null}
      </div>
    </PageTransition>
  );
}

/** Google "G" mark. */
function GoogleGlyph() {
  return (
    <svg className="size-4" viewBox="0 0 24 24" aria-hidden focusable="false">
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1Z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.99.66-2.26 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A11 11 0 0 0 12 23Z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.1a6.6 6.6 0 0 1 0-4.2V7.06H2.18a11 11 0 0 0 0 9.88l3.66-2.84Z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1A11 11 0 0 0 2.18 7.06L5.84 9.9C6.71 7.31 9.14 5.38 12 5.38Z"
      />
    </svg>
  );
}
