import Image from "next/image";
import Link from "next/link";
import { Bus, Clock, ExternalLink, Lock, MapPin } from "lucide-react";
import { Reveal } from "@/components/reveal";
import { SectionHeader } from "@/components/section-header";
import { SCHEDULE, VENUE, WEDDING } from "@/lib/content";

/**
 * Details section. The exact venue (address + map) and the day-of schedule are
 * invited-only; anonymous/identified visitors see the general region, travel
 * suggestions, and a prompt to open their invitation link.
 */
export function DetailsSection({ invited }: { invited: boolean }) {
  const mapSrc = `https://maps.google.com/maps?q=${encodeURIComponent(
    VENUE.mapQuery,
  )}&output=embed`;
  const mapLink = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
    VENUE.mapQuery,
  )}`;

  return (
    <section id="details" className="scroll-mt-32 border-t border-border py-20 sm:py-28">
      <div className="mx-auto max-w-5xl px-5">
        <Reveal>
          <SectionHeader
            eyebrow="The where & when"
            title="Details"
            subtitle="Placeholder details for the ceremony, travel, and the day-of schedule. We'll firm these up as plans come together."
          />
        </Reveal>

        {!invited ? (
          /* Public / identified: region only + prompt to unlock the exact venue. */
          <Reveal className="mb-20">
            <div className="card mx-auto max-w-2xl p-8 text-center">
              <span className="inline-flex size-12 items-center justify-center rounded-full bg-surface-2 text-accent">
                <MapPin className="size-6" aria-hidden />
              </span>
              <h3 className="mt-5 font-serif text-2xl text-foreground">{WEDDING.region}</h3>
              <p className="mx-auto mt-3 max-w-md text-muted">
                The exact venue, address, and the day-of schedule are shared with invited guests.
                Open the personal link from your invitation to see everything.
              </p>
              <Link
                href="/#rsvp"
                className="mt-6 inline-flex items-center gap-1.5 text-sm font-medium text-accent-strong hover:underline"
              >
                <Lock className="size-4" aria-hidden /> Invited? Open your invitation link
              </Link>
            </div>
          </Reveal>
        ) : (
          /* --- Venue: map with an overlapping info card featuring the church photo (invited) --- */
          <Reveal className="mb-20">
            <div className="relative">
            {/* Map layer */}
            <div className="card overflow-hidden">
              <iframe
                title={`Map to ${VENUE.name}`}
                src={mapSrc}
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                className="h-72 w-full sm:h-[26rem]"
              />
            </div>

            {/* Info card overlapping the map, led by a compact photo of the church in fall */}
            <div className="card relative z-10 mx-auto -mt-16 w-[92%] overflow-hidden p-0 sm:-mt-[22rem] sm:ml-auto sm:mr-8 sm:w-[24rem]">
              <div className="relative aspect-[16/9] w-full">
                <Image
                  src={VENUE.photo}
                  alt={VENUE.photoAlt}
                  fill
                  sizes="(max-width: 640px) 92vw, 24rem"
                  className="object-cover"
                />
              </div>
              <div className="p-6 sm:p-7">
                <span className="flex items-center gap-2 text-accent">
                  <MapPin className="size-5" aria-hidden />
                  <h3 className="font-serif text-2xl text-foreground">{VENUE.name}</h3>
                </span>
                <p className="mt-3 text-muted">{VENUE.address}</p>
                <a
                  href={mapLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-4 inline-flex items-center gap-1 text-accent-strong hover:underline"
                >
                  View on map <ExternalLink className="size-4" aria-hidden />
                </a>
              </div>
            </div>
          </div>

            <p className="card mt-6 flex items-start gap-3 p-5 text-muted">
              <Bus className="mt-0.5 size-5 shrink-0 text-accent" aria-hidden />
              <span>{VENUE.parkNote}</span>
            </p>
          </Reveal>
        )}

        {/* --- Day-of schedule: vertical spine timeline (invited-only) --- */}
        {invited ? (
          <Reveal>
            <h3 className="mb-8 text-center font-serif text-3xl text-foreground">The Day</h3>
          <ol className="relative mx-auto max-w-2xl border-l-2 border-border pl-8">
            {SCHEDULE.map((event) => (
              <li key={event.id} className="relative pb-9 last:pb-0">
                {/* node on the spine */}
                <span
                  className="absolute -left-[2.55rem] top-1 flex size-5 items-center justify-center rounded-full border-2 border-accent bg-background"
                  aria-hidden
                >
                  <span className="size-1.5 rounded-full bg-accent" />
                </span>
                <div className="flex flex-wrap items-baseline gap-x-3">
                  <span className="inline-flex items-center gap-1.5 font-serif text-lg text-accent-strong">
                    <Clock className="size-4" aria-hidden />
                    {event.time}
                  </span>
                  <h4 className="font-serif text-xl text-foreground">{event.title}</h4>
                </div>
                <p className="mt-1 text-muted">{event.description}</p>
              </li>
            ))}
            </ol>
          </Reveal>
        ) : null}
      </div>
    </section>
  );
}
