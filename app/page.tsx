import { HeroSection } from "@/components/sections/hero-section";
import { StorySection } from "@/components/sections/story-section";
import { DetailsSection } from "@/components/sections/details-section";
import { FeaturedGallerySection } from "@/components/sections/featured-gallery-section";
import { FeaturedRegistrySection } from "@/components/sections/featured-registry-section";
import type { Metadata } from "next";
import { RsvpSection } from "@/components/sections/rsvp-section";
import { WatercolorMargins } from "@/components/watercolor-margins";
import { getAccess } from "@/lib/access";
import { getGuestRsvp } from "@/lib/data";
import { deriveGuestName, isValidParam } from "@/lib/guest";
import { WEDDING } from "@/lib/content";

// Content is gated by visitor tier (invited vs public), which depends on
// cookies, so render per request rather than prerendering.
export const dynamic = "force-dynamic";

/**
 * Personalized share preview. Invite links carry `?guest=<slug>` (see the guest
 * provider), so when a guest shares their link the crawler fetches that URL and
 * we can bake their name into the Open Graph image + description. The image
 * itself is generated at /api/og, which receives the derived display name since
 * it can't read the visitor's session cookie.
 */
export async function generateMetadata({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}): Promise<Metadata> {
  const params = await searchParams;
  const guestParam = Array.isArray(params.guest) ? params.guest[0] : params.guest;
  const name = isValidParam(guestParam) ? deriveGuestName(guestParam) : null;

  const ogImage = name ? `/api/og?to=${encodeURIComponent(name)}` : "/api/og";
  const title = `${WEDDING.coupleNames} · Wedding`;
  // Invited guests (link carries ?guest) get invitation language; a bare share
  // to someone who isn't invited gets a neutral announcement instead.
  const description = name
    ? `${name}, you're invited to celebrate the wedding of ${WEDDING.coupleNames} — ${WEDDING.date}.`
    : `${WEDDING.coupleNames} are getting married — ${WEDDING.date}, in the Great Smoky Mountains.`;
  const alt = name
    ? `Wedding invitation for ${name} — ${WEDDING.coupleNames}, ${WEDDING.date}`
    : `${WEDDING.coupleNames} are getting married — ${WEDDING.date}`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: "website",
      images: [{ url: ogImage, width: 1200, height: 630, alt }],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [ogImage],
    },
  };
}

export default async function HomePage() {
  const access = await getAccess();
  const invited = access.tier === "invited";

  // Prefill the RSVP form for guests who have already responded.
  const existingRsvp = access.guest ? await getGuestRsvp(access.guest.id) : null;
  const initialAttending: "yes" | "no" | null =
    existingRsvp?.attending == null ? null : existingRsvp.attending ? "yes" : "no";
  const initialBringingGuest = existingRsvp ? existingRsvp.guestCount > 1 : true;
  const initialMessage = existingRsvp?.message ?? "";

  return (
    <div className="relative">
      <WatercolorMargins />
      <HeroSection invited={invited} />
      <StorySection />
      <DetailsSection invited={invited} />
      <FeaturedGallerySection />
      <FeaturedRegistrySection />
      <RsvpSection
        invited={invited}
        guestName={access.guest?.name ?? null}
        plusOne={access.guest?.plusOne ?? false}
        initialAttending={initialAttending}
        initialBringingGuest={initialBringingGuest}
        initialMessage={initialMessage}
      />
    </div>
  );
}
