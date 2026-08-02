"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Sprig } from "@/components/ornament";
import { WEDDING } from "@/lib/content";

/**
 * The first-open "envelope reveal". When a guest opens their personal invite
 * link for the first time (gated by lib/guest.ts:hasSeenReveal), this plays a
 * short sealed-envelope-opening sequence over the site, then waits for the guest
 * to click "Enter" before dismissing to the personalized page underneath.
 *
 * The motion is a genuine open: the wax seal breaks, the top flap swings open on
 * the rotateX axis, and the invitation letter slides up and out of the envelope.
 * The envelope FRONT is an opaque panel layered above the letter (higher
 * z-index), so the letter stays hidden until it clears the envelope's top edge —
 * the standard CSS-envelope layering technique.
 *
 * Layout note: the flap, seal, and letter are all nested INSIDE the envelope box
 * and positioned relative to it, so the flap is always hinged to the envelope's
 * top edge regardless of where the group is centered.
 *
 * There is deliberately no auto-dismiss: guests must click "Enter" so a slow
 * reader is never cut off mid-sentence. Escape still closes for accessibility,
 * and "Skip" jumps to the open letter (it does not close the reveal).
 */

/** What to reveal. `name` may be null when we couldn't derive a display name. */
export interface RevealState {
  name: string | null;
}

type Phase = "sealed" | "opening" | "emerging" | "ready";

/* --- Envelope geometry (px). --- */
const ENV_W = 300;
const ENV_H = 200;
const FLAP_H = 96; // flap apex seats into the pocket's V opening at center
const LETTER_W = 228; // narrower than the envelope so the open flap shows behind it
const LETTER_REST_SCALE = 0.34; // small enough to stay hidden behind the front
const LETTER_OUT_Y = -108; // how far the letter rises out of the envelope (px, envelope-relative)

export function InviteReveal({
  reveal,
  onClose,
}: {
  reveal: RevealState | null;
  onClose: () => void;
}) {
  return (
    <AnimatePresence>
      {reveal ? <RevealScene key="invite-reveal" name={reveal.name} onDismiss={onClose} /> : null}
    </AnimatePresence>
  );
}

function RevealScene({ name, onDismiss }: { name: string | null; onDismiss: () => void }) {
  const [phase, setPhase] = useState<Phase>("sealed");

  // Read the latest dismiss handler from a ref so the timeline effect can stay
  // mount-only without depending on the (possibly changing) handler identity.
  const dismissRef = useRef(onDismiss);
  useEffect(() => {
    dismissRef.current = onDismiss;
  }, [onDismiss]);

  // Timed opening sequence. No auto-dismiss — it stops at "ready".
  useEffect(() => {
    const timers = [
      window.setTimeout(() => setPhase("opening"), 900),
      window.setTimeout(() => setPhase("emerging"), 1750),
      window.setTimeout(() => setPhase("ready"), 2650),
    ];
    return () => timers.forEach((id) => window.clearTimeout(id));
  }, []);

  // Take over from the pre-paint cover (see app/layout + globals.css). The
  // overlay is opaque from the first frame, so removing the cover is seamless.
  useEffect(() => {
    document.documentElement.classList.remove("invite-pending");
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  // Escape closes (accessibility escape hatch).
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") dismissRef.current();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const opened = phase !== "sealed";
  const out = phase === "emerging" || phase === "ready";
  const ready = phase === "ready";

  return (
    <motion.div
      role="dialog"
      aria-modal="true"
      aria-label={name ? `Invitation for ${name}` : "Your invitation"}
      className="fixed inset-0 z-[100] flex items-center justify-center overflow-hidden px-6"
      initial={{ opacity: 1 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.6, ease: "easeInOut" }}
    >
      {/* Warm paper backdrop with a soft center glow (matches the pre-paint cover). */}
      <div
        aria-hidden
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(circle at 50% 38%, var(--surface) 0%, var(--background) 72%)",
        }}
      />

      {/* Skip only fast-forwards to the open letter; it never closes the reveal. */}
      {!ready ? (
        <button
          type="button"
          onClick={() => setPhase("ready")}
          className="absolute right-5 top-5 z-10 rounded-full border border-border bg-background/70 px-4 py-1.5 text-xs uppercase tracking-[0.2em] text-muted backdrop-blur transition-colors hover:border-accent hover:text-accent-strong"
        >
          Skip
        </button>
      ) : null}

      {/* Group is nudged down so the tall emerged letter reads as centered.
          The whole composition is a fixed-px, centered unit — so it renders
          identically regardless of screen width. It's scaled down on small
          screens so the 300px envelope always fits phones (down to ~320px). */}
      <div className="origin-center scale-90 sm:scale-100" style={{ marginTop: 120 }}>
        {/* Envelope box — the positioning context for the flap / seal / letter. */}
        <div className="relative" style={{ width: ENV_W, height: ENV_H, perspective: 1100 }}>
          {/* Back panel (the inside, revealed once the flap opens). */}
          <div className="pointer-events-none absolute inset-0 rounded-md border-[1.5px] border-foreground bg-surface-2" />

          {/* Letter — behind the front; slides up and out. */}
          <motion.div
            className="absolute bottom-2 left-1/2 z-10 origin-bottom"
            style={{ width: LETTER_W, marginLeft: -LETTER_W / 2 }}
            initial={{ y: 0, scale: LETTER_REST_SCALE }}
            animate={out ? { y: LETTER_OUT_Y, scale: 1 } : { y: 0, scale: LETTER_REST_SCALE }}
            transition={{ duration: 0.95, ease: [0.22, 1, 0.36, 1] }}
          >
            {/* Extra bottom padding leaves only blank paper to tuck into the
                envelope, so the Enter button always clears the front edge. A
                soft neutral shadow (not the pink .card shadow) keeps the letter
                clean where it meets the envelope mouth. */}
            <div className="rounded-md border-[1.5px] border-foreground bg-background px-6 pb-14 pt-7 text-center shadow-[0_12px_30px_-12px_rgba(30,42,34,0.4)]">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: ready ? 1 : 0 }}
                transition={{ duration: 0.6, delay: ready ? 0.15 : 0 }}
              >
                <p className="text-xs uppercase tracking-[0.28em] text-accent">
                  You&rsquo;re invited
                </p>
                <Sprig className="mx-auto mt-3 h-4 w-24 text-accent/70" />

                {name ? (
                  <h2 className="mt-4 font-serif text-2xl text-foreground sm:text-3xl">
                    Dear {name},
                  </h2>
                ) : (
                  <h2 className="mt-4 font-serif text-2xl text-foreground sm:text-3xl">
                    With great joy
                  </h2>
                )}

                <p className="mx-auto mt-3 max-w-xs text-sm leading-relaxed text-muted">
                  We would be honored to have you celebrate our wedding with us.
                </p>

                <p className="mt-5 font-serif text-xl text-accent-strong">
                  {WEDDING.coupleNames}
                </p>
                <p className="mt-1 text-xs uppercase tracking-[0.2em] text-muted">
                  {WEDDING.date}
                </p>

                <button
                  type="button"
                  autoFocus
                  onClick={() => dismissRef.current()}
                  className="mt-6 rounded-full bg-accent-strong px-8 py-2.5 text-sm font-medium text-white shadow-md transition-transform hover:-translate-y-0.5"
                >
                  Enter
                </button>
              </motion.div>
            </div>
          </motion.div>

          {/* Front pocket — an opaque panel with a V-shaped opening at the top
              (valley at center). Layered above the letter, so its sloped edges
              overlap the letter's lower half and it reads as being pulled out of
              the envelope. The V opening is where the flap seats when closed. */}
          <div className="pointer-events-none absolute inset-0 z-20 overflow-hidden rounded-md">
            <svg
              aria-hidden
              viewBox={`0 0 ${ENV_W} ${ENV_H}`}
              preserveAspectRatio="none"
              className="absolute inset-0 h-full w-full"
            >
              <path
                d={`M0 0 L${ENV_W / 2} ${FLAP_H} L${ENV_W} 0 L${ENV_W} ${ENV_H} L0 ${ENV_H} Z`}
                fill="var(--surface)"
                stroke="var(--foreground)"
                strokeWidth="1.5"
              />
              {/* Faint bottom fold seam for depth. */}
              <path
                d={`M0 ${ENV_H} L${ENV_W / 2} ${ENV_H - 52} L${ENV_W} ${ENV_H}`}
                fill="none"
                stroke="var(--foreground)"
                strokeOpacity="0.15"
                strokeWidth="1"
              />
            </svg>
          </div>

          {/* Top flap — hinged at the envelope's top edge. It folds all the way
              open (rotateX 180) and stays as a solid triangle standing behind
              the letter. z-[5] keeps it BEHIND the letter (z-10) so it can never
              cover the letter mid-open, while the front pocket (z-20) stays in
              front for the tuck. */}
          <motion.div
            className="pointer-events-none absolute left-0 top-0 z-[5] w-full"
            style={{ height: FLAP_H, transformOrigin: "top center" }}
            initial={{ rotateX: 0 }}
            animate={{ rotateX: opened ? 180 : 0 }}
            transition={{ duration: 0.8, ease: "easeInOut" }}
          >
            {/* Solid triangle fill via clip-path — a div background stays 100%
                opaque under the 3D fold, whereas an SVG `fill` can render
                see-through when rotated. The SVG on top provides only the
                ink outline. Downward triangle: base at top, apex at center. */}
            <div
              className="absolute inset-0 bg-surface-2"
              style={{ clipPath: "polygon(0 0, 100% 0, 50% 100%)" }}
            />
            <svg
              aria-hidden
              viewBox={`0 0 ${ENV_W} ${FLAP_H}`}
              preserveAspectRatio="none"
              className="absolute inset-0 h-full w-full"
            >
              <path
                d={`M0 0 L${ENV_W} 0 L${ENV_W / 2} ${FLAP_H} Z`}
                fill="none"
                stroke="var(--foreground)"
                strokeWidth="1.5"
              />
            </svg>
          </motion.div>

          {/* Wax seal at the flap tip — breaks (scales + fades) as the flap opens. */}
          <motion.div
            className="pointer-events-none absolute left-1/2 z-40 flex size-16 items-center justify-center rounded-full bg-accent-strong font-serif text-lg text-white shadow-md ring-4 ring-accent-strong/25"
            style={{ top: FLAP_H - 32, marginLeft: -32 }}
            initial={{ scale: 0.8, opacity: 0 }}
            animate={
              opened
                ? { scale: 1.3, opacity: 0, rotate: -14, y: -8 }
                : { scale: 1, opacity: 1, rotate: 0, y: 0 }
            }
            transition={{ duration: opened ? 0.5 : 0.6, ease: "easeOut" }}
          >
            {WEDDING.initials}
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
}
