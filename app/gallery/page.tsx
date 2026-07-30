import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { PageTransition } from "@/components/page-transition";
import { GalleryGrid } from "@/components/gallery-grid";
import { PHOTOS } from "@/lib/content";
import { getGalleryPhotos } from "@/lib/data";

// Photos are admin-managed in the database, so render per request rather than
// prerendering — new uploads show up without a rebuild.
export const dynamic = "force-dynamic";

export default async function GalleryPage() {
  // Uploaded photos are the source of truth; fall back to the static
  // placeholders when the gallery is empty or the database is unreachable.
  const uploaded = await getGalleryPhotos();
  const photos = uploaded.length > 0 ? uploaded : PHOTOS;

  return (
    <PageTransition>
      <Link
        href="/#gallery"
        className="mb-8 inline-flex items-center gap-1.5 text-sm text-muted transition-colors hover:text-accent-strong"
      >
        <ArrowLeft className="size-4" aria-hidden /> Back to home
      </Link>
      <header className="mb-10 text-center">
        <h1 className="font-serif text-4xl text-foreground sm:text-5xl">Our Moments</h1>
        <p className="mt-3 text-muted">A few favorites from our journey so far.</p>
      </header>
      <GalleryGrid photos={photos} />
    </PageTransition>
  );
}
