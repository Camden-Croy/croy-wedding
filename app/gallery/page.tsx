import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { PageTransition } from "@/components/page-transition";
import { GalleryGrid } from "@/components/gallery-grid";
import { PHOTOS } from "@/lib/content";

export default function GalleryPage() {
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
      <GalleryGrid photos={PHOTOS} />
    </PageTransition>
  );
}
