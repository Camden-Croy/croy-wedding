"use client";

import { useCallback, useState, useTransition } from "react";
import { useRouter } from "next/navigation";

/** Anything with a stable id can be reordered. */
export interface Reorderable {
  id: string;
}

/** Shape shared by the gallery/story reorder server actions. */
interface ReorderResult {
  ok: boolean;
  error?: string;
}

/**
 * Drag-and-drop reordering for a grid of admin cards, laid out left-to-right,
 * top-to-bottom (reading order). Built on native HTML5 drag events so it needs
 * no extra dependency.
 *
 * Behaviour:
 * - Local order updates instantly (optimistic) as a card is dropped onto another.
 * - The new full order of ids is persisted via `persist`. On success we
 *   router.refresh() so the server-rendered order becomes canonical; on failure
 *   we roll back to the previous order and surface the error.
 * - Local order re-syncs whenever the parent sends a new `items` list
 *   (add / edit / delete / refresh), so drag order and CRUD stay consistent.
 *
 * Note: HTML5 drag-and-drop is a desktop/trackpad interaction; it does not fire
 * on touch screens. The admin dashboard is the intended surface for this.
 */
export function usePhotoReorder<T extends Reorderable>(
  items: T[],
  persist: (orderedIds: string[]) => Promise<ReorderResult>,
  /** When true, dragging is ignored (e.g. an edit form is open). */
  locked = false,
) {
  const router = useRouter();
  const [order, setOrder] = useState<T[]>(items);
  const [dragId, setDragId] = useState<string | null>(null);
  const [overId, setOverId] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  // Re-sync local order when the server sends a fresh list (add / edit / delete
  // / refresh). We adjust state during render — the React-recommended pattern
  // for deriving state from props — keyed on a signature of the incoming data
  // so caption/image edits refresh too, not just reordering. An optimistic
  // local reorder leaves `items` unchanged, so it isn't clobbered.
  const signature = JSON.stringify(items);
  const [syncedSignature, setSyncedSignature] = useState(signature);
  if (signature !== syncedSignature) {
    setOrder(items);
    setSyncedSignature(signature);
  }

  const onDragStart = useCallback(
    (id: string) => {
      if (locked) return;
      setError(null);
      setDragId(id);
    },
    [locked],
  );

  const onDragEnter = useCallback(
    (id: string) => {
      if (locked || !dragId) return;
      setOverId(id);
    },
    [locked, dragId],
  );

  const clearDrag = useCallback(() => {
    setDragId(null);
    setOverId(null);
  }, []);

  const onDrop = useCallback(
    (targetId: string) => {
      const sourceId = dragId;
      clearDrag();
      if (locked || !sourceId || sourceId === targetId) return;

      const from = order.findIndex((p) => p.id === sourceId);
      const to = order.findIndex((p) => p.id === targetId);
      if (from === -1 || to === -1) return;

      const previous = order;
      const next = [...order];
      const [moved] = next.splice(from, 1);
      next.splice(to, 0, moved);

      // Apply the optimistic order, then persist. Both run at event time — never
      // inside a setState updater — so the transition isn't started during render.
      setOrder(next);
      setError(null);
      startTransition(async () => {
        const res = await persist(next.map((p) => p.id));
        if (res.ok) {
          router.refresh();
        } else {
          setOrder(previous);
          setError(res.error ?? "Couldn't save the new order. Please try again.");
        }
      });
    },
    [dragId, order, locked, clearDrag, persist, router],
  );

  return {
    /** The photos in their current (optimistic) order — render from this. */
    order,
    /** Id of the card being dragged, for styling. */
    dragId,
    /** Id of the card currently hovered as a drop target, for styling. */
    overId,
    /** True while the new order is being saved. */
    saving: pending,
    /** Non-null when the last save failed. */
    error,
    onDragStart,
    onDragEnter,
    onDrop,
    onDragEnd: clearDrag,
  };
}
