import Image from "next/image";
import { Reveal } from "@/components/reveal";
import { SectionHeader } from "@/components/section-header";
import { StoryCarousel } from "@/components/story-carousel";
import {
  STORY_INTRO,
  STORY_MILESTONES,
  type StoryImage,
  type StoryMilestone,
} from "@/lib/content";
import { getStoryPhotos } from "@/lib/data";

/** Moment ids whose photos are managed via the admin dashboard (DB-backed). */
const MANAGED_MOMENTS = ["facetime", "visits"] as const;

/**
 * Merge admin-uploaded photos into the static milestones. For each managed
 * moment ("facetime", "visits") that has photos in the database, its images are
 * replaced with the uploaded set; otherwise the static placeholders remain so
 * the page still looks complete before anything is uploaded.
 */
async function resolveMilestones(): Promise<StoryMilestone[]> {
  let overrides: Record<string, StoryImage[]> = {};
  try {
    const [facetime, visits] = await Promise.all(
      MANAGED_MOMENTS.map((section) => getStoryPhotos(section)),
    );
    const toImages = (rows: { imageUrl: string; caption: string | null }[]): StoryImage[] =>
      rows.map((r) => ({
        src: r.imageUrl,
        alt: r.caption ?? "Camden & Jordan",
        caption: r.caption ?? undefined,
      }));
    overrides = {
      facetime: toImages(facetime),
      visits: toImages(visits),
    };
  } catch {
    // DB unavailable — fall back to the static placeholder images.
    overrides = {};
  }

  return STORY_MILESTONES.map((milestone) => {
    if (!milestone.moments) return milestone;
    return {
      ...milestone,
      moments: milestone.moments.map((moment) => {
        const uploaded = overrides[moment.id];
        return uploaded && uploaded.length > 0 ? { ...moment, images: uploaded } : moment;
      }),
    };
  });
}

export async function StorySection() {
  const milestones = await resolveMilestones();

  return (
    <section id="story" className="scroll-mt-32 border-t border-border py-20 sm:py-28">
      <div className="mx-auto max-w-5xl px-5">
        <Reveal>
          <SectionHeader eyebrow="How it started" title="Our Story" subtitle={STORY_INTRO} />
        </Reveal>

        <div className="mt-8 space-y-16 sm:space-y-24">
          {milestones.map((milestone, i) =>
            milestone.moments && milestone.moments.length > 0 ? (
              <MomentsChapter key={milestone.id} milestone={milestone} index={i} />
            ) : (
              <StandardChapter key={milestone.id} milestone={milestone} index={i} />
            ),
          )}
        </div>
      </div>
    </section>
  );
}

/** A single milestone: framed photo alongside text, alternating sides. */
function StandardChapter({ milestone, index }: { milestone: StoryMilestone; index: number }) {
  const reverse = index % 2 === 1;
  const photoSrc = milestone.photo ?? `/photos/${4 + index}.jpg`;
  return (
    <Reveal>
      <article className="grid items-center gap-8 sm:grid-cols-2 sm:gap-14">
        <div className={reverse ? "sm:order-2" : ""}>
          <div className="relative aspect-[4/3] overflow-hidden rounded-2xl border border-border bg-surface-2 shadow-lg">
            <Image
              src={photoSrc}
              alt={milestone.title}
              fill
              sizes="(max-width: 640px) 100vw, 45vw"
              className="object-cover"
            />
          </div>
        </div>

        <div className={"relative " + (reverse ? "sm:order-1" : "")}>
          <Ordinal index={index} />
          <div className="relative">
            <p className="text-xs uppercase tracking-[0.25em] text-accent">{milestone.date}</p>
            <h3 className="mt-2 font-serif text-3xl text-foreground">{milestone.title}</h3>
            <p className="mt-3 leading-relaxed text-muted">{milestone.body}</p>
          </div>
        </div>
      </article>
    </Reveal>
  );
}

/**
 * A richer chapter (e.g. "Long distance"): a centered header followed by a
 * stacked set of grouped moment blocks. Moments with photos get a clickable
 * captioned carousel beside their text.
 */
function MomentsChapter({ milestone, index }: { milestone: StoryMilestone; index: number }) {
  return (
    <Reveal>
      <div className="relative text-center">
        <Ordinal index={index} centered />
        <div className="relative">
          <p className="text-xs uppercase tracking-[0.25em] text-accent">{milestone.date}</p>
          <h3 className="mt-2 font-serif text-3xl text-foreground">{milestone.title}</h3>
          <p className="mx-auto mt-3 max-w-2xl leading-relaxed text-muted">{milestone.body}</p>
        </div>
      </div>

      <div className="mt-10 space-y-6">
        {milestone.moments!.map((moment, mi) => {
          const hasImages = !!moment.images && moment.images.length > 0;
          const reverse = mi % 2 === 1;
          return (
            <div key={moment.id} className="card p-6 sm:p-8">
              {hasImages ? (
                <div className="grid gap-6 lg:grid-cols-2 lg:items-center">
                  <div className={reverse ? "lg:order-2" : ""}>
                    <StoryCarousel images={moment.images!} />
                  </div>
                  <div className={reverse ? "lg:order-1" : ""}>
                    <MomentText label={moment.label} body={moment.body} />
                  </div>
                </div>
              ) : (
                <MomentText label={moment.label} body={moment.body} />
              )}
            </div>
          );
        })}
      </div>
    </Reveal>
  );
}

function MomentText({ label, body }: { label: string; body: string }) {
  return (
    <>
      <p className="text-xs uppercase tracking-[0.25em] text-accent">{label}</p>
      <p className="mt-2 leading-relaxed text-muted">{body}</p>
    </>
  );
}

/** Decorative ghost ordinal (01, 02, …). */
function Ordinal({ index, centered = false }: { index: number; centered?: boolean }) {
  return (
    <span
      aria-hidden
      className={
        "pointer-events-none absolute select-none font-serif leading-none text-accent/10 " +
        (centered
          ? "-top-10 left-1/2 -translate-x-1/2 text-[6rem] sm:-top-12 sm:text-[8rem]"
          : "-top-12 left-0 text-[7rem] sm:-top-14 sm:text-[9rem]")
      }
    >
      {String(index + 1).padStart(2, "0")}
    </span>
  );
}
