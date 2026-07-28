import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Reveal } from "@/components/reveal";
import { SectionHeader } from "@/components/section-header";
import { PHOTOS } from "@/lib/content";

/** Featured preview of the gallery; full collection lives on /gallery. */
export function FeaturedGallerySection() {
  const featured = PHOTOS.slice(0, 3);

  return (
    <section id="gallery" className="scroll-mt-32 border-t border-border py-20 sm:py-28">
      <div className="mx-auto max-w-5xl px-5">
        <Reveal>
          <SectionHeader
            eyebrow="A few favorites"
            title="Gallery"
            subtitle="A small preview of our photos."
          />
        </Reveal>

        <Reveal>
          {/* Offset mosaic: a tall anchor image with two stacked companions. */}
          <div className="grid auto-rows-[170px] grid-cols-2 gap-4 sm:auto-rows-[200px]">
            {featured[0] ? (
              <Link
                href="/gallery"
                className="card card--link group relative col-span-2 row-span-2 overflow-hidden sm:col-span-1"
              >
                <Image
                  src={featured[0].src}
                  alt={featured[0].alt}
                  fill
                  sizes="(max-width: 640px) 100vw, 40vw"
                  className="object-cover transition-transform duration-500 group-hover:scale-105"
                />
              </Link>
            ) : null}

            {featured.slice(1, 3).map((photo) => (
              <Link
                key={photo.id}
                href="/gallery"
                className="card card--link group relative overflow-hidden"
              >
                <Image
                  src={photo.src}
                  alt={photo.alt}
                  fill
                  sizes="(max-width: 640px) 50vw, 25vw"
                  className="object-cover transition-transform duration-500 group-hover:scale-105"
                />
              </Link>
            ))}
          </div>
        </Reveal>

        <div className="mt-8 text-center">
          <Link
            href="/gallery"
            className="inline-flex items-center gap-1.5 rounded-full border border-border px-6 py-2.5 text-sm text-foreground transition-colors hover:border-accent hover:text-accent-strong"
          >
            View full gallery <ArrowRight className="size-4" aria-hidden />
          </Link>
        </div>
      </div>
    </section>
  );
}
