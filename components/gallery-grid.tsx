"use client";

import Image from "next/image";
import { useCallback, useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ImageOff, X } from "lucide-react";
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

function Lightbox({ photo, onClose }: { photo: Photo; onClose: () => void }) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <motion.div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-background/90 p-4 backdrop-blur"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={photo.alt}
    >
      <button
        type="button"
        onClick={onClose}
        className="absolute right-4 top-4 rounded-full border border-border bg-surface p-2 text-foreground hover:text-accent-strong"
        aria-label="Close"
      >
        <X className="size-5" aria-hidden />
      </button>
      <motion.figure
        className="relative max-h-[85vh] w-full max-w-3xl"
        initial={{ scale: 0.96 }}
        animate={{ scale: 1 }}
        exit={{ scale: 0.96 }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="relative aspect-[4/3] w-full overflow-hidden rounded-xl border border-border bg-surface-2">
          <Image
            src={photo.src}
            alt={photo.alt}
            fill
            sizes="(max-width: 768px) 100vw, 768px"
            className="object-contain"
          />
        </div>
        {photo.caption ? (
          <figcaption className="mt-3 text-center text-muted">{photo.caption}</figcaption>
        ) : null}
      </motion.figure>
    </motion.div>
  );
}

export function GalleryGrid({ photos }: { photos: Photo[] }) {
  const [active, setActive] = useState<Photo | null>(null);
  const close = useCallback(() => setActive(null), []);

  // Empty state (Req 4.2).
  if (photos.length === 0) {
    return (
      <p className="rounded-xl border border-border bg-surface p-10 text-center text-muted">
        No photos are available yet. Check back soon.
      </p>
    );
  }

  return (
    <>
      {/* Single column on small screens, multi-column grid above 640px (Req 4.4, 4.5). */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {photos.slice(0, MAX_PHOTOS).map((photo) => (
          <Thumb key={photo.id} photo={photo} onOpen={() => setActive(photo)} />
        ))}
      </div>

      <AnimatePresence>
        {active ? <Lightbox photo={active} onClose={close} /> : null}
      </AnimatePresence>
    </>
  );
}
