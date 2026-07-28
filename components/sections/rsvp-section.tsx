import Image from "next/image";
import Link from "next/link";
import { Lock } from "lucide-react";
import { Reveal } from "@/components/reveal";
import { SectionHeader } from "@/components/section-header";
import { RsvpForm } from "@/components/rsvp-form";
import { WEDDING } from "@/lib/content";

/**
 * RSVP section. The form is invited-only; anonymous/identified visitors see a
 * gentle prompt to open their invitation link instead.
 */
export function RsvpSection({
  invited,
  guestName,
  plusOne,
}: {
  invited: boolean;
  guestName: string | null;
  plusOne: boolean;
}) {
  return (
    <section id="rsvp" className="scroll-mt-32 border-t border-border py-20 sm:py-28">
      <div className="mx-auto max-w-5xl px-5">
        <Reveal>
          <SectionHeader
            eyebrow="We hope you'll come"
            title="RSVP"
            subtitle={
              invited
                ? "Placeholder RSVP form. It's fully clickable but responses aren't saved yet — we'll wire it to the database soon."
                : "RSVP is for our invited guests. Open the personal link from your invitation to respond."
            }
          />
        </Reveal>

        <Reveal>
          <div className="grid items-stretch gap-8 lg:grid-cols-2 lg:gap-12">
            {/* Visual panel: photo with overlaid invitation line */}
            <div className="card relative min-h-[22rem] overflow-hidden">
              <Image
                src="/photos/9.jpg"
                alt={WEDDING.coupleNames}
                fill
                sizes="(max-width: 1024px) 100vw, 45vw"
                className="object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-foreground/85 via-foreground/35 to-transparent" />
              <div className="relative flex h-full flex-col justify-end p-8">
                <p className="font-serif text-3xl leading-snug text-white sm:text-4xl">
                  We can&apos;t wait to celebrate with you.
                </p>
                <p className="mt-4 text-white/85">{WEDDING.date}</p>
                <p className="text-white/85">{WEDDING.region}</p>
              </div>
            </div>

            {/* Form card (invited) or unlock prompt (everyone else) */}
            <div className="card flex flex-col p-6 sm:p-8">
              {invited ? (
                <RsvpForm guestName={guestName} plusOne={plusOne} />
              ) : (
                <div className="flex flex-1 flex-col items-center justify-center text-center">
                  <span className="inline-flex size-12 items-center justify-center rounded-full bg-surface-2 text-accent">
                    <Lock className="size-6" aria-hidden />
                  </span>
                  <h3 className="mt-5 font-serif text-2xl text-foreground">
                    RSVP unlocks with your invitation
                  </h3>
                  <p className="mt-2 max-w-sm text-muted">
                    Open the personal link we sent you to RSVP and see the full schedule and venue
                    details.
                  </p>
                  <Link
                    href="/registry"
                    className="mt-6 inline-flex items-center gap-1.5 text-sm font-medium text-accent-strong hover:underline"
                  >
                    Just here to give a gift? Visit the registry
                  </Link>
                </div>
              )}
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
