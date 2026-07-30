"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Check, Clock, Copy, Loader2, Pencil, Plus, Trash2, X } from "lucide-react";
import { VALID_ACCESS_CODES } from "@/lib/content";
import { slugifyIdentifier } from "@/lib/guest";
import {
  createGuest,
  updateGuest,
  deleteGuest,
  type GuestInput,
  type AdminRsvpState,
} from "@/lib/admin-guest-actions";

/** The guest row shape the manager renders. Mapped in the dashboard. */
export interface AdminGuest {
  id: string;
  name: string;
  identifier: string;
  accessCode: string;
  plusOne: boolean;
  rsvp: AdminRsvpState;
  /** Whether the plus-one is confirmed coming (guestCount > 1). */
  bringingGuest: boolean;
  /** Party size on the RSVP, when responded. */
  guestCount: number;
  /** When the guest responded, if at all. */
  respondedAt: Date | null;
  /** Optional note left with the RSVP. */
  message: string | null;
}

interface FormState {
  name: string;
  identifier: string;
  /** Whether the admin has manually edited the identifier (stops auto-slugging). */
  identifierTouched: boolean;
  accessCode: string;
  plusOne: boolean;
  rsvp: AdminRsvpState;
  bringingGuest: boolean;
}

const EMPTY_FORM: FormState = {
  name: "",
  identifier: "",
  identifierTouched: false,
  accessCode: VALID_ACCESS_CODES[0],
  plusOne: false,
  rsvp: "awaiting",
  bringingGuest: true,
};

function fromGuest(guest: AdminGuest): FormState {
  return {
    name: guest.name,
    identifier: guest.identifier,
    identifierTouched: true,
    accessCode: guest.accessCode,
    plusOne: guest.plusOne,
    rsvp: guest.rsvp,
    bringingGuest: guest.bringingGuest,
  };
}

function toInput(form: FormState): GuestInput {
  return {
    name: form.name,
    identifier: form.identifier,
    accessCode: form.accessCode,
    plusOne: form.plusOne,
    rsvp: form.rsvp,
    bringingGuest: form.bringingGuest,
  };
}

const RSVP_LABELS: Record<AdminRsvpState, string> = {
  awaiting: "Awaiting reply",
  attending: "Attending",
  declined: "Declined",
};

const RSVP_STYLES: Record<AdminRsvpState, string> = {
  attending: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
  declined: "bg-rose-500/10 text-rose-600 dark:text-rose-400",
  awaiting: "bg-surface-2 text-muted",
};

function formatDate(date: Date | null): string {
  if (!date) return "—";
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date);
}

/** Build the personal invite link for a guest (origin resolved at click time). */
function inviteLink(guest: AdminGuest): string {
  const origin = typeof window !== "undefined" ? window.location.origin : "";
  const params = new URLSearchParams({ guest: guest.identifier, code: guest.accessCode });
  return `${origin}/?${params.toString()}`;
}

/**
 * The RSVP table doubles as the guest management surface: it shows each guest's
 * response and lets the couple add, edit, and delete guests, override RSVPs,
 * and copy personal invite links. All writes go through admin-guarded server
 * actions; on success we refresh the server-rendered data.
 */
export function GuestManager({ guests }: { guests: AdminGuest[] }) {
  const router = useRouter();
  // null = closed, "new" = add form open, otherwise the id being edited.
  const [openForm, setOpenForm] = useState<string | null>(null);

  // Total headcount counts each invitation plus its plus-one when included.
  const totalGuests = guests.reduce((sum, g) => sum + (g.plusOne ? 2 : 1), 0);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm text-muted">
          {totalGuests} {totalGuests === 1 ? "guest" : "guests"}
        </p>
        {openForm !== "new" ? (
          <button
            onClick={() => setOpenForm("new")}
            className="inline-flex items-center gap-1.5 rounded-full bg-accent px-4 py-2 text-sm font-medium text-background transition-transform hover:scale-[1.02]"
          >
            <Plus className="size-4" aria-hidden /> Add guest
          </button>
        ) : null}
      </div>

      {openForm === "new" ? (
        <GuestForm
          heading="New guest"
          initial={EMPTY_FORM}
          onClose={() => setOpenForm(null)}
          onSubmit={async (form) => createGuest(toInput(form))}
          onSaved={() => {
            setOpenForm(null);
            router.refresh();
          }}
        />
      ) : null}

      {guests.length > 0 ? (
        <div className="overflow-x-auto rounded-2xl border border-border bg-surface">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-border text-muted">
                <th className="px-5 py-3 font-medium">Guest</th>
                <th className="px-5 py-3 font-medium">Status</th>
                <th className="px-5 py-3 font-medium">Party size</th>
                <th className="px-5 py-3 font-medium">Responded</th>
                <th className="px-5 py-3 font-medium">Message</th>
                <th className="px-5 py-3 text-right font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {guests.map((guest) =>
                openForm === guest.id ? (
                  <tr key={guest.id} className="border-b border-border last:border-0">
                    <td colSpan={6} className="p-4">
                      <GuestForm
                        heading={`Edit ${guest.name}`}
                        initial={fromGuest(guest)}
                        onClose={() => setOpenForm(null)}
                        onSubmit={async (form) => updateGuest(guest.id, toInput(form))}
                        onSaved={() => {
                          setOpenForm(null);
                          router.refresh();
                        }}
                      />
                    </td>
                  </tr>
                ) : (
                  <GuestRow
                    key={guest.id}
                    guest={guest}
                    disabled={openForm !== null}
                    onEdit={() => setOpenForm(guest.id)}
                    onDeleted={() => router.refresh()}
                  />
                ),
              )}
            </tbody>
          </table>
        </div>
      ) : openForm !== "new" ? (
        <p className="rounded-xl border border-border bg-surface p-8 text-center text-muted">
          No guests yet. Add your first one above.
        </p>
      ) : null}
    </div>
  );
}

/** A single guest table row with copy-link, edit, and delete controls. */
function GuestRow({
  guest,
  disabled,
  onEdit,
  onDeleted,
}: {
  guest: AdminGuest;
  disabled: boolean;
  onEdit: () => void;
  onDeleted: () => void;
}) {
  const [confirming, setConfirming] = useState(false);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  function remove() {
    setError(null);
    startTransition(async () => {
      const res = await deleteGuest(guest.id);
      if (res.ok) {
        onDeleted();
      } else {
        setError(res.error ?? "Something went wrong.");
        setConfirming(false);
      }
    });
  }

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(inviteLink(guest));
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      setError("Couldn't copy the link.");
    }
  }

  return (
    <tr className="border-b border-border align-top last:border-0">
      <td className="px-5 py-4">
        <span className="font-medium text-foreground">{guest.name}</span>
        {guest.plusOne ? <span className="ml-2 text-xs text-muted">+1</span> : null}
        <span className="mt-0.5 block truncate font-mono text-xs text-muted/70">
          {guest.identifier}
        </span>
        {error ? <span className="mt-1 block text-xs text-accent-strong">{error}</span> : null}
      </td>
      <td className="px-5 py-4">
        <span
          className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium ${RSVP_STYLES[guest.rsvp]}`}
        >
          {guest.rsvp === "attending" ? (
            <Check className="size-3" aria-hidden />
          ) : guest.rsvp === "awaiting" ? (
            <Clock className="size-3" aria-hidden />
          ) : (
            <X className="size-3" aria-hidden />
          )}
          {RSVP_LABELS[guest.rsvp]}
        </span>
      </td>
      <td className="px-5 py-4 text-muted">
        {guest.rsvp === "attending" ? (
          <span className="inline-flex items-center gap-2">
            <span className="text-foreground">{guest.guestCount}</span>
            {guest.plusOne ? (
              <span
                className={
                  "rounded-full px-2 py-0.5 text-xs font-medium " +
                  (guest.bringingGuest
                    ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                    : "bg-surface-2 text-muted")
                }
              >
                {guest.bringingGuest ? "+1 coming" : "+1 not coming"}
              </span>
            ) : null}
          </span>
        ) : (
          "—"
        )}
      </td>
      <td className="px-5 py-4 text-muted">{formatDate(guest.respondedAt)}</td>
      <td className="px-5 py-4 text-muted">
        {guest.message ? <span className="line-clamp-2 max-w-xs">{guest.message}</span> : "—"}
      </td>
      <td className="px-5 py-4">
        <div className="flex items-center justify-end gap-1.5">
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
                onClick={copyLink}
                disabled={disabled}
                aria-label={`Copy invite link for ${guest.name}`}
                title="Copy invite link"
                className={
                  "inline-flex items-center gap-1 rounded-full px-2.5 py-1.5 text-xs font-medium transition-colors disabled:opacity-40 " +
                  (copied
                    ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                    : "text-muted hover:bg-surface-2 hover:text-foreground")
                }
              >
                {copied ? (
                  <>
                    <Check className="size-3.5" aria-hidden /> Copied
                  </>
                ) : (
                  <>
                    <Copy className="size-3.5" aria-hidden /> Link
                  </>
                )}
              </button>
              <button
                onClick={onEdit}
                disabled={disabled}
                aria-label={`Edit ${guest.name}`}
                className="inline-flex size-8 items-center justify-center rounded-full text-muted transition-colors hover:bg-surface-2 hover:text-foreground disabled:opacity-40"
              >
                <Pencil className="size-4" aria-hidden />
              </button>
              <button
                onClick={() => setConfirming(true)}
                disabled={disabled}
                aria-label={`Delete ${guest.name}`}
                className="inline-flex size-8 items-center justify-center rounded-full text-muted transition-colors hover:bg-rose-500/10 hover:text-rose-600 disabled:opacity-40 dark:hover:text-rose-400"
              >
                <Trash2 className="size-4" aria-hidden />
              </button>
            </>
          )}
        </div>
      </td>
    </tr>
  );
}

/** Shared create/edit form. */
function GuestForm({
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
  const [form, setForm] = useState<FormState>(initial);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function set<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  // Auto-derive the identifier from the name until the admin edits it directly.
  function onNameChange(value: string) {
    setForm((f) => ({
      ...f,
      name: value,
      identifier: f.identifierTouched ? f.identifier : slugifyIdentifier(value),
    }));
  }

  function submit() {
    setError(null);
    startTransition(async () => {
      const res = await onSubmit(form);
      if (res.ok) onSaved();
      else setError(res.error ?? "Something went wrong.");
    });
  }

  const showBringing = form.plusOne && form.rsvp === "attending";

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
        <Field label="Name" className="sm:col-span-2">
          <input
            required
            value={form.name}
            onChange={(e) => onNameChange(e.target.value)}
            className={inputClass}
            placeholder="e.g. Mark Croy"
          />
        </Field>

        <Field label="Invite identifier" hint="Used in the ?guest= link">
          <input
            required
            value={form.identifier}
            onChange={(e) => set("identifier", slugifyIdentifier(e.target.value))}
            onFocus={() => set("identifierTouched", true)}
            className={`${inputClass} font-mono`}
            placeholder="mark_croy"
          />
        </Field>

        <Field label="Access code">
          <select
            value={form.accessCode}
            onChange={(e) => set("accessCode", e.target.value)}
            className={inputClass}
          >
            {VALID_ACCESS_CODES.map((code) => (
              <option key={code} value={code}>
                {code}
              </option>
            ))}
          </select>
        </Field>
      </div>

      <label className="flex items-center gap-2 text-sm text-foreground">
        <input
          type="checkbox"
          checked={form.plusOne}
          onChange={(e) => set("plusOne", e.target.checked)}
          className="size-4 rounded border-border accent-accent"
        />
        This invitation includes a plus-one
      </label>

      <fieldset>
        <legend className="mb-1.5 text-xs font-medium text-muted">RSVP status</legend>
        <div className="grid grid-cols-3 gap-2">
          {(["awaiting", "attending", "declined"] as const).map((state) => (
            <label
              key={state}
              className={
                "cursor-pointer rounded-lg border px-3 py-2 text-center text-sm transition-colors " +
                (form.rsvp === state
                  ? "border-accent bg-accent/10 text-accent-strong"
                  : "border-border bg-surface text-muted hover:text-foreground")
              }
            >
              <input
                type="radio"
                name="rsvp"
                value={state}
                checked={form.rsvp === state}
                onChange={() => set("rsvp", state)}
                className="sr-only"
              />
              {RSVP_LABELS[state]}
            </label>
          ))}
        </div>
      </fieldset>

      {showBringing ? (
        <label className="flex items-center gap-2 text-sm text-foreground">
          <input
            type="checkbox"
            checked={form.bringingGuest}
            onChange={(e) => set("bringingGuest", e.target.checked)}
            className="size-4 rounded border-border accent-accent"
          />
          Bringing their plus-one (counts as 2)
        </label>
      ) : null}

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
            "Save guest"
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
