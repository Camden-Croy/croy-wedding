"use client";

import { useState, useTransition } from "react";
import { Check, Loader2 } from "lucide-react";
import { useGuest } from "@/app/guest-provider";
import { submitRsvp } from "@/lib/rsvp-actions";

type Status = "idle" | "done";

export function RsvpForm({
  guestName,
  plusOne,
  initialAttending = null,
  initialBringingGuest = true,
  initialMessage = "",
}: {
  /** The invited guest's name from their invitation, if known. */
  guestName?: string | null;
  /** Whether this invitation includes a plus-one (decided by the couple). */
  plusOne?: boolean;
  /** Prior response, if the guest has RSVP'd before. */
  initialAttending?: "yes" | "no" | null;
  initialBringingGuest?: boolean;
  initialMessage?: string;
}) {
  const { name } = useGuest();
  const [status, setStatus] = useState<Status>("idle");
  const [attending, setAttending] = useState<"yes" | "no" | null>(initialAttending);
  const [bringingGuest, setBringingGuest] = useState<boolean>(initialBringingGuest);
  const [message, setMessage] = useState<string>(initialMessage);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  // Prefer the name from the invitation record; fall back to the link-derived name.
  const displayName = guestName ?? name ?? null;
  const firstName = displayName?.trim().split(/\s+/)[0] ?? null;

  // The plus-one question only matters when the invitation grants one and the
  // guest is accepting.
  const showPlusOneChoice = Boolean(plusOne) && attending === "yes";

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (attending === null) return;
    setError(null);
    startTransition(async () => {
      const res = await submitRsvp({
        attending: attending === "yes",
        bringingGuest: showPlusOneChoice ? bringingGuest : false,
        message,
      });
      if (res.ok) {
        setStatus("done");
      } else {
        setError(res.error ?? "Something went wrong. Please try again.");
      }
    });
  }

  if (status === "done") {
    const bringing = plusOne && attending === "yes" && bringingGuest;
    return (
      <div className="mx-auto max-w-md rounded-xl border border-border bg-surface p-8 text-center">
        <span className="mx-auto flex size-12 items-center justify-center rounded-full bg-accent/15 text-accent">
          <Check className="size-6" aria-hidden />
        </span>
        <h2 className="mt-4 font-serif text-2xl text-foreground">Thank you!</h2>
        <p className="mt-2 text-muted">
          {attending === "yes" ? (
            <>
              We&apos;ve got you down as joyfully attending
              {bringing ? " with a guest" : ""}. We can&apos;t wait to celebrate with you.
            </>
          ) : (
            <>Thank you for letting us know. You&apos;ll be missed.</>
          )}
        </p>
        <button
          onClick={() => setStatus("idle")}
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
          defaultValue={displayName ?? ""}
          placeholder="Your name"
          readOnly={Boolean(displayName)}
          className="w-full rounded-lg border border-border bg-surface px-4 py-2.5 text-foreground placeholder:text-muted/60 focus-visible:border-accent focus-visible:outline-none read-only:text-muted"
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

      {/* Plus-one question — only when the invitation includes one and the
          guest is attending. */}
      {showPlusOneChoice ? (
        <fieldset>
          <legend className="mb-1.5 text-sm text-muted">
            Your invitation includes a guest. Will you bring someone?
          </legend>
          <div className="grid grid-cols-2 gap-3">
            {([true, false] as const).map((choice) => (
              <label
                key={String(choice)}
                className={
                  "cursor-pointer rounded-lg border px-4 py-2.5 text-center transition-colors " +
                  (bringingGuest === choice
                    ? "border-accent bg-accent/10 text-accent-strong"
                    : "border-border bg-surface text-muted hover:text-foreground")
                }
              >
                <input
                  type="radio"
                  name="bringingGuest"
                  value={String(choice)}
                  checked={bringingGuest === choice}
                  onChange={() => setBringingGuest(choice)}
                  className="sr-only"
                />
                {choice ? "Bringing a guest (2 total)" : "Just me (1)"}
              </label>
            ))}
          </div>
        </fieldset>
      ) : (
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
      )}

      <div>
        <label htmlFor="message" className="mb-1.5 block text-sm text-muted">
          A note for the couple (optional)
        </label>
        <textarea
          id="message"
          name="message"
          rows={3}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Say hello…"
          className="w-full rounded-lg border border-border bg-surface px-4 py-2.5 text-foreground placeholder:text-muted/60 focus-visible:border-accent focus-visible:outline-none"
        />
      </div>

      {error ? <p className="text-sm text-accent-strong">{error}</p> : null}

      <button
        type="submit"
        disabled={pending || attending === null}
        className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-full bg-accent px-8 font-medium text-background transition-transform hover:scale-[1.02] disabled:opacity-70 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-strong"
      >
        {pending ? (
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
