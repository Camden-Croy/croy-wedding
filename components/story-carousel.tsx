"use client";

import { useState } from "react";
import Image from "next/image";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { StoryImage } from "@/lib/content";

/**
 * Keep the frame within tasteful bounds: tall enough for a portrait FaceTime
 * screenshot (~0.46), but never so tall/wide it dominates the layout.
 */
const MIN_RATIO = 0.62; // portrait ceiling (a touch taller than 2:3)
const MAX_RATIO = 1.5; // landscape ceiling (3:2)
const FALLBACK_RATIO = 0.75; // portrait-leaning default before a photo measures

const clampRatio = (r: number) => Math.min(MAX_RATIO, Math.max(MIN_RATIO, r));

/**
 * A clickable image carousel with captions, used for story moments that have
 * several photos (e.g. the long-distance FaceTime chapter). Navigate with the
 * arrows or the dots.
 *
 * The frame adapts to each photo's true aspect ratio instead of forcing a
 * fixed crop — so tall FaceTime screenshots keep the whole face in view. The
 * displayed photo is contained (never cropped) over a blurred copy of itself,
 * which fills any letterbox gap so the frame always looks intentional.
 */
export function StoryCarousel({ images }: { images: StoryImage[] }) {
  const [index, setIndex] = useState(0);
  const [ratios, setRatios] = useState<Record<number, number>>({});

  if (images.length === 0) return null;

  const count = images.length;
  const current = images[index];
  const go = (delta: number) => setIndex((prev) => (prev + delta + count) % count);

  const currentRatio = ratios[index];
  const frameRatio = clampRatio(currentRatio ?? FALLBACK_RATIO);

  return (
    <figure className="mx-auto w-full max-w-xs">
      <div
        className="group relative mx-auto w-full overflow-hidden rounded-2xl border border-border bg-surface-2 shadow-lg transition-[aspect-ratio] duration-500 ease-out"
        style={{ aspectRatio: String(frameRatio) }}
      >
        {images.map((img, i) => (
          <div
            key={img.src + i}
            className={
              "absolute inset-0 transition-opacity duration-500 " +
              (i === index ? "opacity-100" : "opacity-0")
            }
            aria-hidden={i !== index}
          >
            {/* Blurred backdrop fills any letterbox gap around the photo. */}
            <Image
              src={img.src}
              alt=""
              fill
              aria-hidden
              sizes="(max-width: 1024px) 100vw, 45vw"
              className="scale-110 object-cover blur-xl brightness-90"
              priority={i === 0}
            />
            {/* The actual photo, shown in full without cropping. */}
            <Image
              src={img.src}
              alt={img.alt}
              fill
              sizes="(max-width: 1024px) 100vw, 45vw"
              className="object-contain"
              priority={i === 0}
              onLoad={(e) => {
                const el = e.currentTarget;
                if (el.naturalWidth && el.naturalHeight) {
                  const r = el.naturalWidth / el.naturalHeight;
                  setRatios((prev) => (prev[i] === r ? prev : { ...prev, [i]: r }));
                }
              }}
            />
          </div>
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
