"use client";

import Image from "next/image";
import Link from "next/link";
import { CalendarHeart, ChevronDown, MapPin } from "lucide-react";
import { Countdown } from "@/components/countdown";
import { ArchOutline } from "@/components/ornament";
import { useGuest } from "@/app/guest-provider";
import { WEDDING } from "@/lib/content";

export function HeroSection({ invited }: { invited: boolean }) {
  const { name } = useGuest();

  return (
    <section id="top" className="relative overflow-hidden px-5 pb-24 pt-10 sm:pt-16">
      <div className="mx-auto grid max-w-6xl items-center gap-12 lg:grid-cols-[1fr_0.85fr] lg:gap-16">
        {/* --- Left: text column --- */}
        <div className="relative z-10 text-center lg:text-left">
          <p className="text-sm uppercase tracking-[0.3em] text-accent">
            Together with our families
          </p>

          <h1 className="mt-6 font-serif text-6xl leading-[1.05] text-foreground sm:text-7xl xl:text-8xl">
            {WEDDING.partners.one.firstName}
            <span className="mx-3 inline-block align-middle text-accent-strong">&amp;</span>
            {WEDDING.partners.two.firstName}
          </h1>

          <p className="mt-8 max-w-xl text-lg text-muted lg:mx-0 mx-auto">
            {invited ? (
              name ? (
                <>
                  <span className="text-accent-strong">Dear {name}</span>, we would be honored
                  to have you celebrate our wedding with us.
                </>
              ) : (
                <>We would be honored to have you celebrate our wedding with us.</>
              )
            ) : (
              <>
                We&rsquo;re getting married in the Great Smoky Mountains, and we&rsquo;re so glad
                you&rsquo;re here.
              </>
            )}
          </p>

          <dl className="mt-8 flex flex-col items-center gap-4 text-muted sm:flex-row sm:gap-8 lg:justify-start">
            <div className="flex items-center gap-2">
              <CalendarHeart className="size-5 text-accent" aria-hidden />
              <dd>{WEDDING.date}</dd>
            </div>
            <div className="flex items-center gap-2">
              <MapPin className="size-5 text-accent" aria-hidden />
              <dd>{WEDDING.region}</dd>
            </div>
          </dl>

          {/* Invitation CTAs are for invited guests only. Non-invitees who land
              on the bare site get the neutral announcement above without a call
              to RSVP or unlock invited-only details. */}
          {invited ? (
            <div className="mt-10 flex flex-col items-center gap-3 sm:flex-row lg:justify-start">
              <Link
                href="/#rsvp"
                className="rounded-full bg-accent-strong px-7 py-3 text-sm font-medium text-white shadow-md transition-transform hover:-translate-y-0.5"
              >
                RSVP
              </Link>
              <Link
                href="/#details"
                className="rounded-full border border-border px-7 py-3 text-sm text-foreground transition-colors hover:border-accent hover:text-accent-strong"
              >
                View details
              </Link>
            </div>
          ) : null}
        </div>

        {/* --- Right: layered photo composition --- */}
        <div className="relative mx-auto w-full max-w-sm lg:max-w-none">
          {/* Arch outline offset behind for depth */}
          <ArchOutline className="absolute -right-5 -top-5 h-[105%] w-[92%] text-accent/35" />

          {/* Primary arched portrait */}
          <div className="relative aspect-[4/5] overflow-hidden rounded-[999px_999px_1.5rem_1.5rem] border border-border bg-surface-2 shadow-xl">
            <Image
              src="/photos/1.jpg"
              alt={`${WEDDING.coupleNames}`}
              fill
              priority
              sizes="(max-width: 1024px) 24rem, 34vw"
              className="object-cover"
            />
          </div>

          {/* Secondary overlapping snapshot */}
          <div className="absolute -bottom-8 -left-6 hidden aspect-square w-40 overflow-hidden rounded-2xl border-4 border-background bg-surface-2 shadow-lg sm:block">
            <Image
              src="/photos/14.jpg"
              alt={`${WEDDING.coupleNames}`}
              fill
              sizes="10rem"
              className="object-cover"
            />
          </div>
        </div>
      </div>

      {/* --- Overlapping countdown card, straddling the section edge --- */}
      <div className="relative z-20 mx-auto mt-20 max-w-3xl px-1">
        <div className="card p-6 sm:p-8">
          <p className="mb-5 text-center text-xs uppercase tracking-[0.25em] text-accent">
            Counting down to the big day
          </p>
          <Countdown dateISO={WEDDING.dateISO} />
        </div>
      </div>

      <a
        href="#story"
        aria-label="Scroll to our story"
        className="mt-16 hidden justify-center text-muted transition-colors hover:text-accent-strong sm:flex"
      >
        <ChevronDown className="size-7 animate-bounce" aria-hidden />
      </a>
    </section>
  );
}
