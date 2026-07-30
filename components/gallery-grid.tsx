"use client";

import Image from "next/image";
import { useCallback, useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronLeft, ChevronRight, Download, ImageOff, X } from "lucide-react";
import type { Photo } from "@/lib/content";

const MAX_PHOTOS = 200;

function Thumb({
  photo,
  onOpen,
}: {
  photo: Photo;
  onOpen: () => void;
}) {
  const [failed, setFailed] = useState(false);

  return (
    <figure className="relative aspect-square overflow-hidden rounded-xl border border-border bg-surface-2">
      {failed ? (
        // Placeholder shown when a photo fails to load (Req 4.3).
        <div className="flex h-full w-full flex-col items-center justify-center gap-2 text-muted">
          <ImageOff className="size-8" aria-hidden />
          <span className="px-4 text-center text-xs">{photo.alt}</span>
        </div>
      ) : (
        <button
          type="button"
          onClick={onOpen}
          className="group h-full w-full cursor-zoom-in focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-strong"
          aria-label={`View photo: ${photo.alt}`}
        >
          <Image
            src={photo.src}
            alt={photo.alt}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            className="object-cover transition-transform duration-500 group-hover:scale-105"
            onError={() => setFailed(true)}
          />
          {photo.caption ? (
            <figcaption className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-background/90 to-transparent p-3 text-left text-sm text-foreground opacity-0 transition-opacity group-hover:opacity-100">
              {photo.caption}
            </figcaption>
          ) : null}
        </button>
      )}
    </figure>
  );
}

/**
 * Force a download of the given photo. Vercel Blob URLs honor a `?download=1`
 * query param (sets Content-Disposition: attachment); same-origin static files
 * work with the anchor's `download` attribute directly.
 */
function downloadPhoto(photo: Photo) {
  let href = photo.src;
  try {
    const url = new URL(photo.src, window.location.origin);
    if (url.hostname.endsWith(".public.blob.vercel-storage.com")) {
      url.searchParams.set("download", "1");
    }
    href = url.toString();
  } catch {
    // Fall back to the raw src.
  }

  const a = document.createElement("a");
  a.href = href;
  // Suggest a filename from the caption/alt; the server's Content-Disposition
  // (for blob downloads) still wins where present.
  const base = (photo.caption ?? photo.alt ?? "photo").trim().slice(0, 60) || "photo";
  a.download = base.replace(/[^\w.-]+/g, "-");
  a.rel = "noopener";
  document.body.appendChild(a);
  a.click();
  a.remove();
}

/**
 * Fullscreen photo-album view. Click through with the on-screen arrows or the
 * keyboard (←/→), read the optional caption, and download the current photo.
 */
function Lightbox({
  photos,
  index,
  onClose,
  onNavigate,
}: {
  photos: Photo[];
  index: number;
  onClose: () => void;
  onNavigate: (nextIndex: number) => void;
}) {
  const photo = photos[index];
  const count = photos.length;

  const goPrev = useCallback(() => {
    onNavigate((index - 1 + count) % count);
  }, [index, count, onNavigate]);

  const goNext = useCallback(() => {
    onNavigate((index + 1) % count);
  }, [index, count, onNavigate]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      else if (e.key === "ArrowLeft") goPrev();
      else if (e.key === "ArrowRight") goNext();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose, goPrev, goNext]);

  if (!photo) return null;

  const hasMultiple = count > 1;

  return (
    <motion.div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-background/95 p-4 backdrop-blur sm:p-6"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={photo.alt}
    >
      {/* Top controls: counter + download + close. */}
      <div
        className="absolute inset-x-0 top-0 z-10 flex items-center justify-between p-4 sm:p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <span className="rounded-full bg-surface/80 px-3 py-1 text-xs font-medium text-muted">
          {index + 1} / {count}
        </span>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => downloadPhoto(photo)}
            className="inline-flex items-center gap-1.5 rounded-full border border-border bg-surface px-3 py-2 text-sm font-medium text-foreground transition-colors hover:text-accent-strong"
            aria-label="Download this photo"
          >
            <Download className="size-4" aria-hidden />
            <span className="hidden sm:inline">Download</span>
          </button>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full border border-border bg-surface p-2 text-foreground hover:text-accent-strong"
            aria-label="Close"
          >
            <X className="size-5" aria-hidden />
          </button>
        </div>
      </div>

      {/* Previous arrow. */}
      {hasMultiple ? (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            goPrev();
          }}
          className="absolute left-2 top-1/2 z-10 -translate-y-1/2 rounded-full border border-border bg-surface/90 p-2.5 text-foreground transition-colors hover:text-accent-strong sm:left-5"
          aria-label="Previous photo"
        >
          <ChevronLeft className="size-6" aria-hidden />
        </button>
      ) : null}

      {/* The photo. A key on the figure animates the crossfade between photos.
          The image sizes to the viewport (not a fixed box), so portrait and
          landscape photos both fill most of the screen without letterboxing. */}
      <AnimatePresence mode="wait">
        <motion.figure
          key={photo.id}
          className="flex h-full max-h-[92vh] w-full max-w-[92vw] flex-col items-center justify-center gap-3 px-10 sm:px-16"
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.98 }}
          transition={{ duration: 0.2 }}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="relative min-h-0 w-full flex-1">
            <Image
              src={photo.src}
              alt={photo.alt}
              fill
              sizes="92vw"
              className="object-contain"
              priority
            />
          </div>
          {photo.caption ? (
            <figcaption className="max-w-2xl shrink-0 text-center text-muted">
              {photo.caption}
            </figcaption>
          ) : null}
        </motion.figure>
      </AnimatePresence>

      {/* Next arrow. */}
      {hasMultiple ? (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            goNext();
          }}
          className="absolute right-2 top-1/2 z-10 -translate-y-1/2 rounded-full border border-border bg-surface/90 p-2.5 text-foreground transition-colors hover:text-accent-strong sm:right-5"
          aria-label="Next photo"
        >
          <ChevronRight className="size-6" aria-hidden />
        </button>
      ) : null}
    </motion.div>
  );
}

export function GalleryGrid({ photos }: { photos: Photo[] }) {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const close = useCallback(() => setActiveIndex(null), []);

  // Empty state (Req 4.2).
  if (photos.length === 0) {
    return (
      <p className="rounded-xl border border-border bg-surface p-10 text-center text-muted">
        No photos are available yet. Check back soon.
      </p>
    );
  }

  const visible = photos.slice(0, MAX_PHOTOS);

  return (
    <>
      {/* Single column on small screens, multi-column grid above 640px (Req 4.4, 4.5). */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {visible.map((photo, i) => (
          <Thumb key={photo.id} photo={photo} onOpen={() => setActiveIndex(i)} />
        ))}
      </div>

      <AnimatePresence>
        {activeIndex !== null ? (
          <Lightbox
            photos={visible}
            index={activeIndex}
            onClose={close}
            onNavigate={setActiveIndex}
          />
        ) : null}
      </AnimatePresence>
    </>
  );
}
