"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { GripVertical, ImagePlus, Loader2, Pencil, Plus, Trash2, Upload, X } from "lucide-react";
import { upload } from "@vercel/blob/client";
import {
  createGalleryPhoto,
  updateGalleryPhoto,
  deleteGalleryPhoto,
  reorderGalleryPhotos,
} from "@/lib/admin-gallery-actions";
import { usePhotoReorder } from "@/components/use-photo-reorder";

/** A gallery photo row as rendered by the manager. Mapped in the dashboard. */
export interface AdminGalleryPhoto {
  id: string;
  imageUrl: string;
  caption: string | null;
}

/**
 * Admin management surface for the public photo gallery: add, edit (caption /
 * replace image), and delete captioned photos that render on /gallery.
 *
 * Image bytes upload straight from the browser to Vercel Blob via `upload()`;
 * only the resulting URL + caption are persisted through admin-guarded Server
 * Actions. After a successful mutation we call router.refresh() so the
 * server-rendered list re-fetches.
 */
export function GalleryManager({ photos }: { photos: AdminGalleryPhoto[] }) {
  const router = useRouter();
  // null = closed, "new" = add form open, otherwise the id being edited.
  const [openForm, setOpenForm] = useState<string | null>(null);

  // Drag-and-drop reordering. Locked while any add/edit form is open so the
  // layout doesn't shift mid-edit.
  const reorder = usePhotoReorder(photos, reorderGalleryPhotos, openForm !== null);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm text-muted">
          {photos.length} {photos.length === 1 ? "photo" : "photos"}
        </p>
        {openForm !== "new" ? (
          <button
            onClick={() => setOpenForm("new")}
            className="inline-flex items-center gap-1.5 rounded-full bg-accent px-4 py-2 text-sm font-medium text-background transition-transform hover:scale-[1.02]"
          >
            <Plus className="size-4" aria-hidden /> Add photo
          </button>
        ) : null}
      </div>

      {photos.length > 1 && openForm === null ? (
        <p className="flex items-center gap-2 text-xs text-muted">
          <GripVertical className="size-3.5 shrink-0" aria-hidden />
          <span>
            Drag photos to reorder them. They show on the gallery page left to
            right, top to bottom.
          </span>
          {reorder.saving ? (
            <span className="inline-flex items-center gap-1 text-accent-strong">
              <Loader2 className="size-3.5 animate-spin" aria-hidden /> Saving order…
            </span>
          ) : null}
        </p>
      ) : null}

      {reorder.error ? (
        <p className="rounded-lg border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-sm text-rose-600 dark:text-rose-400">
          {reorder.error}
        </p>
      ) : null}

      {openForm === "new" ? (
        <PhotoForm
          heading="New gallery photo"
          initial={{ imageUrl: "", caption: "" }}
          onClose={() => setOpenForm(null)}
          onSubmit={async ({ imageUrl, caption }) =>
            createGalleryPhoto({ imageUrl, caption })
          }
          onSaved={() => {
            setOpenForm(null);
            router.refresh();
          }}
        />
      ) : null}

      <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {reorder.order.map((photo) =>
          openForm === photo.id ? (
            <li key={photo.id} className="sm:col-span-2 lg:col-span-3">
              <PhotoForm
                heading="Edit photo"
                initial={{ imageUrl: photo.imageUrl, caption: photo.caption ?? "" }}
                onClose={() => setOpenForm(null)}
                onSubmit={async ({ imageUrl, caption }) =>
                  updateGalleryPhoto(photo.id, { imageUrl, caption })
                }
                onSaved={() => {
                  setOpenForm(null);
                  router.refresh();
                }}
              />
            </li>
          ) : (
            <li
              key={photo.id}
              draggable={openForm === null}
              onDragStart={() => reorder.onDragStart(photo.id)}
              onDragEnter={() => reorder.onDragEnter(photo.id)}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault();
                reorder.onDrop(photo.id);
              }}
              onDragEnd={reorder.onDragEnd}
              className={[
                "group relative rounded-2xl transition",
                openForm === null ? "cursor-grab active:cursor-grabbing" : "",
                reorder.dragId === photo.id ? "opacity-50" : "",
                reorder.overId === photo.id && reorder.dragId !== photo.id
                  ? "ring-2 ring-accent ring-offset-2 ring-offset-background"
                  : "",
              ].join(" ")}
            >
              {openForm === null ? (
                <span
                  className="pointer-events-none absolute left-2 top-2 z-10 inline-flex items-center rounded-full bg-background/80 p-1 text-muted opacity-0 shadow-sm backdrop-blur transition group-hover:opacity-100"
                  aria-hidden
                >
                  <GripVertical className="size-4" />
                </span>
              ) : null}
              <PhotoRow
                photo={photo}
                disabled={openForm !== null}
                onEdit={() => setOpenForm(photo.id)}
                onDeleted={() => router.refresh()}
              />
            </li>
          ),
        )}
      </ul>

      {photos.length === 0 && openForm !== "new" ? (
        <p className="rounded-xl border border-border bg-surface p-8 text-center text-muted">
          No photos yet. Add your first one above — it&apos;ll show up on the gallery page.
        </p>
      ) : null}
    </div>
  );
}

/** A single read-only photo card with edit + delete controls. */
function PhotoRow({
  photo,
  disabled,
  onEdit,
  onDeleted,
}: {
  photo: AdminGalleryPhoto;
  disabled: boolean;
  onEdit: () => void;
  onDeleted: () => void;
}) {
  const [confirming, setConfirming] = useState(false);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function remove() {
    setError(null);
    startTransition(async () => {
      const res = await deleteGalleryPhoto(photo.id);
      if (res.ok) {
        onDeleted();
      } else {
        setError(res.error ?? "Something went wrong.");
        setConfirming(false);
      }
    });
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-surface">
      <div className="relative aspect-[4/3] bg-surface-2">
        <Image
          src={photo.imageUrl}
          alt={photo.caption ?? "Gallery photo"}
          fill
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 45vw, 30vw"
          className="object-cover"
        />
      </div>
      <div className="flex items-start justify-between gap-3 p-4">
        <p className="min-w-0 flex-1 text-sm text-muted">
          {photo.caption ? (
            <span className="italic">{photo.caption}</span>
          ) : (
            <span className="text-muted/60">No caption</span>
          )}
          {error ? <span className="mt-1 block text-accent-strong">{error}</span> : null}
        </p>

        <div className="flex shrink-0 items-center gap-1.5">
          {confirming ? (
            <span className="inline-flex items-center gap-2">
              <button
                onClick={remove}
                disabled={pending}
                className="inline-flex items-center gap-1 rounded-full bg-rose-500/10 px-3 py-1.5 text-xs font-medium text-rose-600 hover:bg-rose-500/20 disabled:opacity-60 dark:text-rose-400"
              >
                {pending ? <Loader2 className="size-3.5 animate-spin" aria-hidden /> : null}
                Confirm
              </button>
              <button
                onClick={() => setConfirming(false)}
                disabled={pending}
                className="rounded-full px-2 py-1.5 text-xs text-muted hover:text-foreground"
              >
                Cancel
              </button>
            </span>
          ) : (
            <>
              <button
                onClick={onEdit}
                disabled={disabled}
                aria-label="Edit photo"
                className="inline-flex size-8 items-center justify-center rounded-full text-muted transition-colors hover:bg-surface-2 hover:text-foreground disabled:opacity-40"
              >
                <Pencil className="size-4" aria-hidden />
              </button>
              <button
                onClick={() => setConfirming(true)}
                disabled={disabled}
                aria-label="Delete photo"
                className="inline-flex size-8 items-center justify-center rounded-full text-muted transition-colors hover:bg-rose-500/10 hover:text-rose-600 disabled:opacity-40 dark:hover:text-rose-400"
              >
                <Trash2 className="size-4" aria-hidden />
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

interface FormState {
  imageUrl: string;
  caption: string;
}

/** Shared create/edit form: upload an image and set an optional caption. */
function PhotoForm({
  heading,
  initial,
  onClose,
  onSubmit,
  onSaved,
}: {
  heading: string;
  initial: FormState;
  onClose: () => void;
  onSubmit: (form: FormState) => Promise<{ ok: boolean; error?: string }>;
  onSaved: () => void;
}) {
  const [caption, setCaption] = useState(initial.caption);
  // The persisted/uploaded blob URL, and a local object URL for instant preview.
  const [imageUrl, setImageUrl] = useState(initial.imageUrl);
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(initial.imageUrl || null);
  const [uploading, setUploading] = useState(false);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const hasImage = Boolean(previewUrl);

  function onPickFile(e: React.ChangeEvent<HTMLInputElement>) {
    const picked = e.target.files?.[0] ?? null;
    setError(null);

    // Reject obvious non-images. Files with an empty type still pass here (we
    // default their content type to image/jpeg on upload).
    if (picked && picked.type && !picked.type.startsWith("image/")) {
      setError("Please choose an image file.");
      setFile(null);
      return;
    }

    setFile(picked);
    setPreviewUrl(picked ? URL.createObjectURL(picked) : imageUrl || null);
  }

  function submit() {
    setError(null);

    // Do the (async) blob upload, then persist via the server action. Wrapped in
    // a transition so the surrounding list refresh is batched.
    startTransition(async () => {
      let finalUrl = imageUrl;

      if (file) {
        try {
          setUploading(true);
          const blob = await upload(file.name, file, {
            access: "public",
            handleUploadUrl: "/api/blob/upload",
            // Always send an image content type. Some files (e.g. certain phone
            // exports) report an empty File.type, which fails the token's
            // image/* check at the Blob API and surfaces as a CORS error.
            contentType: file.type || "image/jpeg",
          });
          finalUrl = blob.url;
          setImageUrl(blob.url);
          setFile(null);
        } catch {
          setUploading(false);
          setError("Image upload failed. Please try again.");
          return;
        }
        setUploading(false);
      }

      if (!finalUrl) {
        setError("Please choose an image to upload.");
        return;
      }

      const res = await onSubmit({ imageUrl: finalUrl, caption });
      if (res.ok) onSaved();
      else setError(res.error ?? "Something went wrong.");
    });
  }

  const busy = pending || uploading;

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        submit();
      }}
      className="space-y-4 rounded-2xl border border-accent/40 bg-surface p-5 shadow-sm"
    >
      <div className="flex items-center justify-between">
        <h3 className="font-serif text-lg text-foreground">{heading}</h3>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="inline-flex size-8 items-center justify-center rounded-full text-muted hover:bg-surface-2 hover:text-foreground"
        >
          <X className="size-4" aria-hidden />
        </button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 sm:items-start">
        <div>
          <span className="mb-1.5 block text-xs font-medium text-muted">Image</span>
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="group relative flex aspect-[4/3] w-full items-center justify-center overflow-hidden rounded-xl border border-dashed border-border bg-background text-muted transition-colors hover:border-accent focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-strong"
          >
            {hasImage ? (
              <>
                {/* eslint-disable-next-line @next/next/no-img-element -- object-URL preview can't use next/image */}
                <img
                  src={previewUrl!}
                  alt="Selected preview"
                  className="absolute inset-0 size-full object-cover"
                />
                <span className="absolute inset-x-0 bottom-0 flex items-center justify-center gap-1.5 bg-foreground/60 py-1.5 text-xs font-medium text-white opacity-0 transition-opacity group-hover:opacity-100">
                  <Upload className="size-3.5" aria-hidden /> Replace
                </span>
              </>
            ) : (
              <span className="flex flex-col items-center gap-2 text-sm">
                <ImagePlus className="size-6" aria-hidden />
                Click to upload
              </span>
            )}
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={onPickFile}
            className="sr-only"
          />
          <p className="mt-1.5 text-xs text-muted/70">JPG, PNG, WebP, or GIF up to 50MB.</p>
        </div>

        <label className="block">
          <span className="mb-1.5 flex items-baseline justify-between text-xs font-medium text-muted">
            Caption
            <span className="font-normal text-muted/70">Optional</span>
          </span>
          <textarea
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            rows={4}
            className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground outline-none transition-colors placeholder:text-muted/60 focus:border-accent"
            placeholder="e.g. Sunset on the beach in Maui"
          />
        </label>
      </div>

      {error ? <p className="text-sm text-accent-strong">{error}</p> : null}

      <div className="flex gap-2">
        <button
          type="submit"
          disabled={busy}
          className="inline-flex items-center gap-2 rounded-full bg-accent px-5 py-2.5 text-sm font-medium text-background transition-transform hover:scale-[1.02] disabled:opacity-70"
        >
          {busy ? (
            <>
              <Loader2 className="size-4 animate-spin" aria-hidden />{" "}
              {uploading ? "Uploading…" : "Saving…"}
            </>
          ) : (
            "Save photo"
          )}
        </button>
        <button
          type="button"
          onClick={onClose}
          disabled={busy}
          className="rounded-full border border-border px-5 py-2.5 text-sm text-muted transition-colors hover:text-foreground"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
