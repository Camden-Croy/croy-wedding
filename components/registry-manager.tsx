"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Check, Loader2, Pencil, Plus, Trash2, X } from "lucide-react";
import { formatPrice } from "@/lib/content";
import {
  createRegistryItem,
  updateRegistryItem,
  deleteRegistryItem,
  type RegistryItemInput,
} from "@/lib/admin-registry-actions";

/** The registry row shape the manager renders. Mapped in the dashboard. */
export interface AdminRegistryItem {
  id: string;
  title: string;
  description: string;
  category: string;
  url: string | null;
  priceCents: number | null;
  note: string | null;
  isFund: boolean;
  /** Whether a guest has claimed it (derived from claimedById on the server). */
  claimed: boolean;
}

const EMPTY_FORM: FormState = {
  title: "",
  description: "",
  category: "",
  url: "",
  priceDollars: "",
  note: "",
  isFund: false,
};

interface FormState {
  title: string;
  description: string;
  category: string;
  url: string;
  priceDollars: string;
  note: string;
  isFund: boolean;
}

function toInput(form: FormState): RegistryItemInput {
  const price = form.priceDollars.trim();
  return {
    title: form.title,
    description: form.description,
    category: form.category,
    url: form.url,
    note: form.note,
    isFund: form.isFund,
    priceDollars: price === "" ? null : Number(price),
  };
}

function fromItem(item: AdminRegistryItem): FormState {
  return {
    title: item.title,
    description: item.description,
    category: item.category,
    url: item.url ?? "",
    priceDollars: item.priceCents != null ? String(item.priceCents / 100) : "",
    note: item.note ?? "",
    isFund: item.isFund,
  };
}

/**
 * Admin registry management surface: add, edit, and delete gifts.
 *
 * All writes go through admin-guarded server actions; this component only
 * collects input and reflects the result. After a successful mutation we call
 * router.refresh() so the server-rendered list re-fetches.
 */
export function RegistryManager({
  items,
  categories,
}: {
  items: AdminRegistryItem[];
  categories: string[];
}) {
  const router = useRouter();
  // null = closed, "new" = add form open, otherwise the id being edited.
  const [openForm, setOpenForm] = useState<string | null>(null);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm text-muted">
          {items.length} {items.length === 1 ? "gift" : "gifts"} in the registry
        </p>
        {openForm !== "new" ? (
          <button
            onClick={() => setOpenForm("new")}
            className="inline-flex items-center gap-1.5 rounded-full bg-accent px-4 py-2 text-sm font-medium text-background transition-transform hover:scale-[1.02]"
          >
            <Plus className="size-4" aria-hidden /> Add gift
          </button>
        ) : null}
      </div>

      {openForm === "new" ? (
        <GiftForm
          heading="New gift"
          initial={EMPTY_FORM}
          categories={categories}
          onClose={() => setOpenForm(null)}
          onSubmit={async (form) => createRegistryItem(toInput(form))}
          onSaved={() => {
            setOpenForm(null);
            router.refresh();
          }}
        />
      ) : null}

      <ul className="space-y-3">
        {items.map((item) =>
          openForm === item.id ? (
            <li key={item.id}>
              <GiftForm
                heading={`Edit “${item.title}”`}
                initial={fromItem(item)}
                categories={categories}
                onClose={() => setOpenForm(null)}
                onSubmit={async (form) => updateRegistryItem(item.id, toInput(form))}
                onSaved={() => {
                  setOpenForm(null);
                  router.refresh();
                }}
              />
            </li>
          ) : (
            <li key={item.id}>
              <GiftRow
                item={item}
                disabled={openForm !== null}
                onEdit={() => setOpenForm(item.id)}
                onDeleted={() => router.refresh()}
              />
            </li>
          ),
        )}
      </ul>

      {items.length === 0 && openForm !== "new" ? (
        <p className="rounded-xl border border-border bg-surface p-8 text-center text-muted">
          No gifts yet. Add your first one above.
        </p>
      ) : null}
    </div>
  );
}

/** A single read-only registry row with edit + delete controls. */
function GiftRow({
  item,
  disabled,
  onEdit,
  onDeleted,
}: {
  item: AdminRegistryItem;
  disabled: boolean;
  onEdit: () => void;
  onDeleted: () => void;
}) {
  const [confirming, setConfirming] = useState(false);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const price = formatPrice(item.priceCents);

  function remove() {
    setError(null);
    startTransition(async () => {
      const res = await deleteRegistryItem(item.id);
      if (res.ok) {
        onDeleted();
      } else {
        setError(res.error ?? "Something went wrong.");
        setConfirming(false);
      }
    });
  }

  return (
    <div className="flex items-start justify-between gap-4 rounded-2xl border border-border bg-surface p-4">
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-medium text-foreground">{item.title}</span>
          <span className="rounded-full bg-surface-2 px-2.5 py-0.5 text-xs text-muted">
            {item.category}
          </span>
          {item.isFund ? (
            <span className="rounded-full bg-accent/15 px-2.5 py-0.5 text-xs font-medium text-accent">
              Fund
            </span>
          ) : price ? (
            <span className="rounded-full bg-accent/10 px-2.5 py-0.5 text-xs font-medium text-accent-strong">
              {price}
            </span>
          ) : null}
          {item.claimed ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-xs font-medium text-emerald-600 dark:text-emerald-400">
              <Check className="size-3" aria-hidden /> Claimed
            </span>
          ) : null}
        </div>
        <p className="mt-1 line-clamp-2 text-sm text-muted">{item.description}</p>
        {error ? <p className="mt-2 text-sm text-accent-strong">{error}</p> : null}
      </div>

      <div className="flex shrink-0 items-center gap-1.5">
        {confirming ? (
          <span className="inline-flex items-center gap-2">
            <button
              onClick={remove}
              disabled={pending}
              className="inline-flex items-center gap-1 rounded-full bg-rose-500/10 px-3 py-1.5 text-xs font-medium text-rose-600 hover:bg-rose-500/20 disabled:opacity-60 dark:text-rose-400"
            >
              {pending ? <Loader2 className="size-3.5 animate-spin" aria-hidden /> : null}
              Confirm delete
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
              aria-label={`Edit ${item.title}`}
              className="inline-flex size-8 items-center justify-center rounded-full text-muted transition-colors hover:bg-surface-2 hover:text-foreground disabled:opacity-40"
            >
              <Pencil className="size-4" aria-hidden />
            </button>
            <button
              onClick={() => setConfirming(true)}
              disabled={disabled}
              aria-label={`Delete ${item.title}`}
              className="inline-flex size-8 items-center justify-center rounded-full text-muted transition-colors hover:bg-rose-500/10 hover:text-rose-600 disabled:opacity-40 dark:hover:text-rose-400"
            >
              <Trash2 className="size-4" aria-hidden />
            </button>
          </>
        )}
      </div>
    </div>
  );
}

/** Shared create/edit form. */
function GiftForm({
  heading,
  initial,
  categories,
  onClose,
  onSubmit,
  onSaved,
}: {
  heading: string;
  initial: FormState;
  categories: string[];
  onClose: () => void;
  onSubmit: (form: FormState) => Promise<{ ok: boolean; error?: string }>;
  onSaved: () => void;
}) {
  const [form, setForm] = useState<FormState>(initial);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function set<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function submit() {
    setError(null);
    startTransition(async () => {
      const res = await onSubmit(form);
      if (res.ok) onSaved();
      else setError(res.error ?? "Something went wrong.");
    });
  }

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

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label="Title" className="sm:col-span-2">
          <input
            required
            value={form.title}
            onChange={(e) => set("title", e.target.value)}
            className={inputClass}
            placeholder="e.g. Stand Mixer"
          />
        </Field>

        <Field label="Description" className="sm:col-span-2">
          <textarea
            required
            value={form.description}
            onChange={(e) => set("description", e.target.value)}
            rows={2}
            className={inputClass}
            placeholder="A short, warm description."
          />
        </Field>

        <Field label="Category">
          <input
            required
            list="registry-categories"
            value={form.category}
            onChange={(e) => set("category", e.target.value)}
            className={inputClass}
            placeholder="e.g. The Kitchen"
          />
          <datalist id="registry-categories">
            {categories.map((c) => (
              <option key={c} value={c} />
            ))}
          </datalist>
        </Field>

        <Field label="Price (USD)" hint={form.isFund ? "Funds are open-ended" : "Optional"}>
          <input
            type="number"
            min="0"
            step="0.01"
            value={form.priceDollars}
            onChange={(e) => set("priceDollars", e.target.value)}
            disabled={form.isFund}
            className={inputClass}
            placeholder="e.g. 120"
          />
        </Field>

        <Field label="Link (URL)" className="sm:col-span-2" hint="Optional">
          <input
            type="url"
            value={form.url}
            onChange={(e) => set("url", e.target.value)}
            className={inputClass}
            placeholder="https://…"
          />
        </Field>

        <Field label="Note" className="sm:col-span-2" hint="Optional — a short personal note">
          <input
            value={form.note}
            onChange={(e) => set("note", e.target.value)}
            className={inputClass}
            placeholder="e.g. Jordan has opinions about the color."
          />
        </Field>
      </div>

      <label className="flex items-center gap-2 text-sm text-foreground">
        <input
          type="checkbox"
          checked={form.isFund}
          onChange={(e) => set("isFund", e.target.checked)}
          className="size-4 rounded border-border accent-accent"
        />
        This is an open-ended contribution fund (no price, never claimable)
      </label>

      {error ? <p className="text-sm text-accent-strong">{error}</p> : null}

      <div className="flex gap-2">
        <button
          type="submit"
          disabled={pending}
          className="inline-flex items-center gap-2 rounded-full bg-accent px-5 py-2.5 text-sm font-medium text-background transition-transform hover:scale-[1.02] disabled:opacity-70"
        >
          {pending ? (
            <>
              <Loader2 className="size-4 animate-spin" aria-hidden /> Saving…
            </>
          ) : (
            "Save gift"
          )}
        </button>
        <button
          type="button"
          onClick={onClose}
          disabled={pending}
          className="rounded-full border border-border px-5 py-2.5 text-sm text-muted transition-colors hover:text-foreground"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}

const inputClass =
  "w-full rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground outline-none transition-colors placeholder:text-muted/60 focus:border-accent disabled:opacity-50";

function Field({
  label,
  hint,
  className = "",
  children,
}: {
  label: string;
  hint?: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <label className={`block ${className}`}>
      <span className="mb-1.5 flex items-baseline justify-between text-xs font-medium text-muted">
        {label}
        {hint ? <span className="font-normal text-muted/70">{hint}</span> : null}
      </span>
      {children}
    </label>
  );
}
