"use client";

import { useState } from "react";
import { Check, Loader2 } from "lucide-react";
import { useGuest } from "@/app/guest-provider";

type Status = "idle" | "submitting" | "done";

export function RsvpForm({
  guestName,
  plusOne,
}: {
  /** The invited guest's name from their invitation, if known. */
  guestName?: string | null;
  /** Whether this invitation includes a plus-one (decided by the couple). */
  plusOne?: boolean;
}) {
  const { name } = useGuest();
  const [status, setStatus] = useState<Status>("idle");
  const [attending, setAttending] = useState<"yes" | "no" | null>(null);

  // Prefer the name from the invitation record; fall back to the link-derived name.
  const displayName = guestName ?? name ?? null;
  const firstName = displayName?.trim().split(/\s+/)[0] ?? null;
  // Party size is fixed by the invitation — guests don't choose a headcount.
  const partySize = plusOne ? 2 : 1;

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setStatus("submitting");
    // TODO: replace this simulated submit with the server action in
    // lib/rsvp-actions.ts (submitRsvp) once the Neon database is live.
    await new Promise((resolve) => setTimeout(resolve, 700));
    setStatus("done");
  }

  if (status === "done") {
    return (
      <div className="mx-auto max-w-md rounded-xl border border-border bg-surface p-8 text-center">
        <span className="mx-auto flex size-12 items-center justify-center rounded-full bg-accent/15 text-accent">
          <Check className="size-6" aria-hidden />
        </span>
        <h2 className="mt-4 font-serif text-2xl text-foreground">Thank you!</h2>
        <p className="mt-2 text-muted">
          Your response has been noted (placeholder — not yet saved to the database).
        </p>
        <button
          onClick={() => {
            setStatus("idle");
            setAttending(null);
          }}
          className="mt-6 text-accent-strong hover:underline"
        >
          Edit response
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="mx-auto max-w-md space-y-6">
      <div>
        <label htmlFor="name" className="mb-1.5 block text-sm text-muted">
          Name
        </label>
        <input
          id="name"
          name="name"
          type="text"
          required
          defaultValue={displayName ?? ""}
          placeholder="Your name"
          className="w-full rounded-lg border border-border bg-surface px-4 py-2.5 text-foreground placeholder:text-muted/60 focus-visible:border-accent focus-visible:outline-none"
        />
      </div>

      <fieldset>
        <legend className="mb-1.5 text-sm text-muted">Will you join us?</legend>
        <div className="grid grid-cols-2 gap-3">
          {(["yes", "no"] as const).map((choice) => (
            <label
              key={choice}
              className={
                "cursor-pointer rounded-lg border px-4 py-2.5 text-center transition-colors " +
                (attending === choice
                  ? "border-accent bg-accent/10 text-accent-strong"
                  : "border-border bg-surface text-muted hover:text-foreground")
              }
            >
              <input
                type="radio"
                name="attending"
                value={choice}
                checked={attending === choice}
                onChange={() => setAttending(choice)}
                className="sr-only"
                required
              />
              {choice === "yes" ? "Joyfully accept" : "Regretfully decline"}
            </label>
          ))}
        </div>
      </fieldset>

      {/* Headcount is set by the invitation, not chosen by the guest. */}
      <input type="hidden" name="guestCount" value={partySize} />

      <div className="rounded-lg border border-border bg-surface-2/50 px-4 py-3 text-sm text-muted">
        {plusOne ? (
          <>
            This invitation is for{" "}
            <span className="font-medium text-foreground">
              {firstName ? `${firstName} plus a guest` : "you plus a guest"}
            </span>
            . You&apos;re welcome to bring someone along.
          </>
        ) : (
          <>
            This invitation is reserved just for{" "}
            <span className="font-medium text-foreground">{firstName ?? "you"}</span>.
          </>
        )}
      </div>

      <div>
        <label htmlFor="message" className="mb-1.5 block text-sm text-muted">
          A note for the couple (optional)
        </label>
        <textarea
          id="message"
          name="message"
          rows={3}
          placeholder="Say hello…"
          className="w-full rounded-lg border border-border bg-surface px-4 py-2.5 text-foreground placeholder:text-muted/60 focus-visible:border-accent focus-visible:outline-none"
        />
      </div>

      <button
        type="submit"
        disabled={status === "submitting"}
        className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-full bg-accent px-8 font-medium text-background transition-transform hover:scale-[1.02] disabled:opacity-70 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-strong"
      >
        {status === "submitting" ? (
          <>
            <Loader2 className="size-4 animate-spin" aria-hidden /> Sending…
          </>
        ) : (
          "Send RSVP"
        )}
      </button>
    </form>
  );
}
