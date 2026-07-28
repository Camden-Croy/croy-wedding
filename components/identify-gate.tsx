"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Mail } from "lucide-react";
import { identifyGiver } from "@/lib/giver-actions";

/**
 * The "Who's giving?" gate shown to anonymous visitors on the registry.
 *
 * Two paths: invited guests open their personal link (unlocks everything);
 * anyone else leaves an email to give. The email is attribution only — it does
 * not unlock private/invited content.
 */
export function IdentifyGate() {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);

  function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const res = await identifyGiver(email, name || undefined);
      if (res.ok) router.refresh();
      else setError(res.error ?? "Something went wrong.");
    });
  }

  return (
    <div
      id="identify"
      className="mx-auto mb-12 max-w-2xl scroll-mt-32 rounded-3xl border border-border bg-surface p-7 shadow-sm sm:p-8"
    >
      <h2 className="font-serif text-2xl text-foreground">Who&apos;s giving?</h2>
      <p className="mt-2 text-sm text-muted">
        Invited guests, open the personal link from your invitation to unlock everything. Otherwise,
        leave your email so we can mark your gift and send a proper thank-you.
      </p>

      <form onSubmit={submit} className="mt-6 space-y-3">
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label htmlFor="giver-name" className="mb-1 block text-xs text-muted">
              Name (optional)
            </label>
            <input
              id="giver-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your name"
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted/60 focus-visible:border-accent focus-visible:outline-none"
            />
          </div>
          <div>
            <label htmlFor="giver-email" className="mb-1 block text-xs text-muted">
              Email
            </label>
            <input
              id="giver-email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted/60 focus-visible:border-accent focus-visible:outline-none"
            />
          </div>
        </div>
        <button
          type="submit"
          disabled={pending}
          className="inline-flex items-center justify-center gap-2 rounded-full bg-accent px-6 py-2.5 text-sm font-medium text-background transition-transform hover:scale-[1.02] disabled:opacity-70"
        >
          {pending ? (
            <>
              <Loader2 className="size-4 animate-spin" aria-hidden /> One moment…
            </>
          ) : (
            <>
              <Mail className="size-4" aria-hidden /> Continue to give
            </>
          )}
        </button>
        {error ? <p className="text-sm text-accent-strong">{error}</p> : null}
      </form>
    </div>
  );
}
