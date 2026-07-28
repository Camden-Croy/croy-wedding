"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ArrowUpRight, Check, Gift, HeartHandshake, Loader2, Lock } from "lucide-react";
import { formatPrice } from "@/lib/content";
import { setRegistryItemPurchased } from "@/lib/registry-actions";

/**
 * Normalized shape the card renders — see app/registry/page.tsx for mapping.
 *
 * Note: the buyer's identity is never sent to the client. Claims show
 * generically ("Reserved"); `claimedByMe` is a server-computed boolean that only
 * tells this guest whether *they* are the claimer (so we can offer "Release").
 */
export interface RegistryCardItem {
  id: string;
  title: string;
  description: string;
  category: string;
  priceCents: number | null;
  url: string | null;
  note: string | null;
  isFund: boolean;
  purchased: boolean;
  /** True only when the current session guest is the one who claimed it. */
  claimedByMe: boolean;
}

/**
 * True when the current URL hash points at `id`. Deep links from the home page
 * featured cards (`/registry#<id>`) use this to scroll the card into view and
 * highlight it. Uses JS rather than the `:target` CSS pseudo-class because that
 * is unreliable across client-side navigation + the page transition animation.
 */
function useIsHashTarget(id: string): boolean {
  const [isTarget, setIsTarget] = useState(false);

  useEffect(() => {
    function check() {
      const hash = decodeURIComponent(window.location.hash.replace(/^#/, ""));
      const match = hash === id;
      setIsTarget(match);
      if (match) {
        // Wait a frame so the page-transition layout has settled before scrolling.
        requestAnimationFrame(() => {
          document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
        });
      }
    }
    check();
    window.addEventListener("hashchange", check);
    return () => window.removeEventListener("hashchange", check);
  }, [id]);

  return isTarget;
}

/**
 * A single registry gift and its claim controls.
 *
 * `interactive` is false in the read-only fallback (database unreachable).
 * `canGive` is true for an invited guest or an identified email giver; without
 * it, claiming is disabled and we point the visitor to the "Who's giving?" gate.
 */
export function RegistryItemCard({
  item,
  interactive,
  canGive,
}: {
  item: RegistryCardItem;
  interactive: boolean;
  canGive: boolean;
}) {
  const router = useRouter();
  const isTarget = useIsHashTarget(item.id);
  const [pending, startTransition] = useTransition();
  const [mode, setMode] = useState<"view" | "confirm" | "release">("view");
  const [error, setError] = useState<string | null>(null);

  const price = formatPrice(item.priceCents);

  function claim() {
    setError(null);
    startTransition(async () => {
      const res = await setRegistryItemPurchased(item.id, true);
      if (res.ok) {
        setMode("view");
      } else if (res.alreadyClaimed) {
        setError("Someone just claimed this one — thank you though!");
        router.refresh();
      } else {
        setError(res.error ?? "Something went wrong.");
      }
    });
  }

  function release() {
    setError(null);
    startTransition(async () => {
      const res = await setRegistryItemPurchased(item.id, false);
      if (res.ok) setMode("view");
      else setError(res.error ?? "Something went wrong.");
    });
  }

  // --- Contribution fund: a distinct, always-open card -----------------------
  if (item.isFund) {
    return (
      <article
        id={item.id}
        className={
          "relative flex h-full scroll-mt-32 flex-col overflow-hidden rounded-3xl border bg-gradient-to-br from-surface-2 to-surface p-7 transition-all duration-300 " +
          (isTarget ? "border-accent ring-4 ring-accent/40 shadow-lg" : "border-accent/30 shadow-sm")
        }
      >
        <div className="flex items-center justify-between gap-3">
          <span className="inline-flex size-11 items-center justify-center rounded-full bg-accent/15 text-accent">
            <HeartHandshake className="size-5" aria-hidden />
          </span>
          <span className="rounded-full bg-accent/15 px-3 py-1 text-xs font-medium text-accent">
            Contribution
          </span>
        </div>
        <h3 className="mt-5 font-serif text-2xl text-foreground">{item.title}</h3>
        <p className="mt-2 flex-1 text-muted">{item.description}</p>
        {item.note ? (
          <p className="mt-4 text-sm italic text-muted/90">&ldquo;{item.note}&rdquo;</p>
        ) : null}
        {item.url ? (
          <a
            href={item.url}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-6 inline-flex items-center gap-1.5 self-start rounded-full bg-accent px-5 py-2.5 text-sm font-medium text-background transition-transform hover:scale-[1.02]"
          >
            Contribute <ArrowUpRight className="size-4" aria-hidden />
          </a>
        ) : null}
      </article>
    );
  }

  const claimed = item.purchased;

  return (
    <article
      id={item.id}
      className={
        "relative flex h-full scroll-mt-32 flex-col rounded-3xl border p-7 transition-all duration-300 " +
        (claimed ? "bg-surface-2/60 " : "bg-surface ") +
        (isTarget ? "border-accent ring-4 ring-accent/40 shadow-lg" : "border-border shadow-sm")
      }
    >
      {/* Header: price + status */}
      <div className="flex items-center justify-between gap-3">
        {price ? (
          <span
            className={
              "rounded-full px-3 py-1 text-sm font-semibold " +
              (claimed ? "bg-surface-2 text-muted line-through" : "bg-accent/10 text-accent-strong")
            }
          >
            {price}
          </span>
        ) : (
          <span aria-hidden />
        )}

        {claimed ? (
          <span className="inline-flex items-center gap-1 rounded-full bg-accent/15 px-3 py-1 text-xs font-medium text-accent">
            <Check className="size-3.5" aria-hidden /> Reserved
          </span>
        ) : (
          <span
            className="inline-flex size-9 items-center justify-center rounded-full bg-surface-2 text-accent"
            aria-hidden
          >
            <Gift className="size-4" />
          </span>
        )}
      </div>

      <h3 className={"mt-4 font-serif text-2xl " + (claimed ? "text-muted" : "text-foreground")}>
        {item.title}
      </h3>
      <p className="mt-2 flex-1 text-muted">{item.description}</p>
      {item.note && !claimed ? (
        <p className="mt-4 text-sm italic text-muted/90">&ldquo;{item.note}&rdquo;</p>
      ) : null}

      {/* External "view item" link, when present */}
      {item.url && !claimed ? (
        <a
          href={item.url}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-4 inline-flex items-center gap-1.5 self-start text-sm text-accent-strong hover:underline"
        >
          View item <ArrowUpRight className="size-4" aria-hidden />
        </a>
      ) : null}

      {/* --- Action area ----------------------------------------------------- */}
      <div className="mt-6 border-t border-border pt-5">
        {claimed ? (
          <div className="flex items-center justify-between gap-3">
            <p className="inline-flex items-center gap-1.5 text-sm text-muted">
              <Check className="size-4 text-accent" aria-hidden />
              {item.claimedByMe ? "You claimed this — thank you!" : "Reserved — thank you!"}
            </p>
            {/* Only the guest who claimed it may release it (also enforced server-side). */}
            {interactive && item.claimedByMe ? (
              mode === "release" ? (
                <span className="inline-flex items-center gap-2">
                  <button
                    onClick={release}
                    disabled={pending}
                    className="text-xs font-medium text-accent-strong hover:underline disabled:opacity-60"
                  >
                    {pending ? "Releasing…" : "Confirm"}
                  </button>
                  <button
                    onClick={() => setMode("view")}
                    disabled={pending}
                    className="text-xs text-muted hover:text-foreground"
                  >
                    Cancel
                  </button>
                </span>
              ) : (
                <button
                  onClick={() => setMode("release")}
                  className="text-xs text-muted underline-offset-2 hover:text-foreground hover:underline"
                >
                  Release
                </button>
              )
            ) : null}
          </div>
        ) : !interactive ? (
          <p className="inline-flex items-center gap-1.5 text-sm text-muted">
            <Lock className="size-4" aria-hidden /> Claiming is temporarily unavailable.
          </p>
        ) : !canGive ? (
          <a
            href="#identify"
            className="inline-flex items-center gap-1.5 text-sm text-accent-strong hover:underline"
          >
            <Lock className="size-4 shrink-0" aria-hidden />
            Tell us who you are to give
          </a>
        ) : mode === "confirm" ? (
          <div className="space-y-3">
            <p className="text-sm text-muted">
              Mark this as your gift? We&apos;ll keep it reserved for you — you can release it later
              if plans change.
            </p>
            <div className="flex gap-2">
              <button
                onClick={claim}
                disabled={pending}
                className="inline-flex flex-1 items-center justify-center gap-2 rounded-full bg-accent px-4 py-2.5 text-sm font-medium text-background transition-transform hover:scale-[1.02] disabled:opacity-70"
              >
                {pending ? (
                  <>
                    <Loader2 className="size-4 animate-spin" aria-hidden /> Confirming…
                  </>
                ) : (
                  "Confirm gift"
                )}
              </button>
              <button
                onClick={() => {
                  setMode("view");
                  setError(null);
                }}
                disabled={pending}
                className="rounded-full border border-border px-4 py-2.5 text-sm text-muted transition-colors hover:text-foreground"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <button
            onClick={() => setMode("confirm")}
            className="inline-flex w-full items-center justify-center gap-2 rounded-full border border-accent px-4 py-2.5 text-sm font-medium text-accent-strong transition-colors hover:bg-accent hover:text-background focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-strong"
          >
            <Gift className="size-4" aria-hidden /> I&apos;ll give this gift
          </button>
        )}

        {error ? <p className="mt-3 text-sm text-accent-strong">{error}</p> : null}
      </div>
    </article>
  );
}
