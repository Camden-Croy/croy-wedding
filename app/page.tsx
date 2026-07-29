import { HeroSection } from "@/components/sections/hero-section";
import { StorySection } from "@/components/sections/story-section";
import { DetailsSection } from "@/components/sections/details-section";
import { FeaturedGallerySection } from "@/components/sections/featured-gallery-section";
import { FeaturedRegistrySection } from "@/components/sections/featured-registry-section";
import { RsvpSection } from "@/components/sections/rsvp-section";
import { getAccess } from "@/lib/access";
import { getGuestRsvp } from "@/lib/data";

// Content is gated by visitor tier (invited vs public), which depends on
// cookies, so render per request rather than prerendering.
export const dynamic = "force-dynamic";

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
    <>
      <HeroSection />
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
    </>
  );
}
