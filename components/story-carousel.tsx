"use client";

import { useState } from "react";
import Image from "next/image";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { StoryImage } from "@/lib/content";

/**
 * A clickable image carousel with captions, used for story moments that have
 * several photos (e.g. the long-distance FaceTime chapter). Navigate with the
 * arrows or the dots.
 */
export function StoryCarousel({ images }: { images: StoryImage[] }) {
  const [index, setIndex] = useState(0);

  if (images.length === 0) return null;

  const count = images.length;
  const current = images[index];
  const go = (delta: number) => setIndex((prev) => (prev + delta + count) % count);

  return (
    <figure className="w-full">
      <div className="group relative aspect-[4/3] overflow-hidden rounded-2xl border border-border bg-surface-2 shadow-lg">
        {images.map((img, i) => (
          <Image
            key={img.src + i}
            src={img.src}
            alt={img.alt}
            fill
            sizes="(max-width: 1024px) 100vw, 45vw"
            className={
              "object-cover transition-opacity duration-500 " +
              (i === index ? "opacity-100" : "opacity-0")
            }
            priority={i === 0}
          />
        ))}

        {count > 1 ? (
          <>
            <button
              type="button"
              onClick={() => go(-1)}
              aria-label="Previous photo"
              className="absolute left-2 top-1/2 flex size-9 -translate-y-1/2 items-center justify-center rounded-full bg-background/80 text-foreground shadow-md backdrop-blur transition-colors hover:bg-background focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-strong"
            >
              <ChevronLeft className="size-5" aria-hidden />
            </button>
            <button
              type="button"
              onClick={() => go(1)}
              aria-label="Next photo"
              className="absolute right-2 top-1/2 flex size-9 -translate-y-1/2 items-center justify-center rounded-full bg-background/80 text-foreground shadow-md backdrop-blur transition-colors hover:bg-background focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-strong"
            >
              <ChevronRight className="size-5" aria-hidden />
            </button>

            {/* Position counter */}
            <span className="absolute right-3 top-3 rounded-full bg-foreground/60 px-2 py-0.5 text-xs font-medium text-white">
              {index + 1} / {count}
            </span>

            {/* Dots */}
            <div className="absolute inset-x-0 bottom-3 flex justify-center gap-1.5">
              {images.map((img, i) => (
                <button
                  key={img.src + i}
                  type="button"
                  onClick={() => setIndex(i)}
                  aria-label={`Go to photo ${i + 1}`}
                  aria-current={i === index}
                  className={
                    "size-2 rounded-full transition-all " +
                    (i === index ? "w-5 bg-white" : "bg-white/60 hover:bg-white/90")
                  }
                />
              ))}
            </div>
          </>
        ) : null}
      </div>

      {current.caption ? (
        <figcaption className="mt-3 text-center text-sm italic text-muted">
          {current.caption}
        </figcaption>
      ) : null}
    </figure>
  );
}
