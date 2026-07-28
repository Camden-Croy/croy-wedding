import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { PageTransition } from "@/components/page-transition";
import { RegistryItemCard, type RegistryCardItem } from "@/components/registry-item-card";
import { RegistryNav, type RegistryNavItem } from "@/components/registry-nav";
import { Sprig } from "@/components/ornament";
import { IdentifyGate } from "@/components/identify-gate";
import { REGISTRY_CATEGORY_ORDER, REGISTRY_ITEMS } from "@/lib/content";
import { getRegistryItems } from "@/lib/data";
import { getAccess } from "@/lib/access";

/** Stable DOM id for a category section, used by the sticky category nav. */
function categorySlug(category: string): string {
  return (
    "cat-" +
    category
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
  );
}

// Registry availability changes as guests claim gifts, so render fresh on every
// request rather than prerendering. (Cache Components is not enabled, so the
// route segment `dynamic` flag applies — see the "Caching (Previous Model)" guide.)
export const dynamic = "force-dynamic";

export const metadata = {
  title: "Gift Registry",
};

/** Map a static content item into the card shape (read-only fallback). */
function fromContent(): RegistryCardItem[] {
  return REGISTRY_ITEMS.map((r) => ({
    id: r.id,
    title: r.title,
    description: r.description,
    category: r.category,
    priceCents: r.priceCents ?? null,
    url: r.url ?? null,
    note: r.note ?? null,
    isFund: r.isFund ?? false,
    purchased: r.purchased ?? false,
    claimedByMe: false,
  }));
}

/** Order categories by the configured list, appending any extras alphabetically. */
function orderCategories(categories: string[]): string[] {
  const known = REGISTRY_CATEGORY_ORDER.filter((c) => categories.includes(c));
  const extra = categories
    .filter((c) => !REGISTRY_CATEGORY_ORDER.includes(c))
    .sort((a, b) => a.localeCompare(b));
  return [...known, ...extra];
}

export default async function RegistryPage() {
  let items: RegistryCardItem[];
  let interactive: boolean;

  // Who's visiting: invited guest, identified email giver, or anonymous.
  // Invited guests and identified givers may claim; anonymous visitors identify first.
  const access = await getAccess();
  const canGive = access.canGive;

  try {
    const rows = await getRegistryItems();
    items = rows.map((r) => {
      // Claimed = a guest OR an email giver owns it (single source of truth,
      // consistent with the admin view and immune to a stale `purchased` flag).
      const claimed = r.claimedById !== null || r.claimedByEmail !== null;
      // Does this claim belong to the current visitor? The claimer's identity
      // itself is never sent to the client.
      const claimedByMe =
        (access.tier === "invited" && r.claimedById === access.guest!.id) ||
        (access.tier === "identified" && r.claimedByEmail === access.giverEmail);
      return {
        id: r.id,
        title: r.title,
        description: r.description,
        category: r.category ?? "Gifts",
        priceCents: r.priceCents ?? null,
        url: r.url ?? null,
        note: r.note ?? null,
        isFund: r.isFund,
        purchased: claimed,
        claimedByMe,
      };
    });
    interactive = true;
  } catch {
    // Database unreachable — show the curated content read-only rather than an error.
    items = fromContent();
    interactive = false;
  }

  // Group by category, preserving each item's configured order within a group.
  const byCategory = new Map<string, RegistryCardItem[]>();
  for (const item of items) {
    const list = byCategory.get(item.category) ?? [];
    list.push(item);
    byCategory.set(item.category, list);
  }
  const categories = orderCategories([...byCategory.keys()]);

  // Availability summary across claimable (non-fund) gifts.
  const claimable = items.filter((i) => !i.isFund);
  const available = claimable.filter((i) => !i.purchased).length;

  // Pills for the sticky category nav.
  const navItems: RegistryNavItem[] = categories.map((category) => ({
    slug: categorySlug(category),
    label: category,
    count: byCategory.get(category)!.length,
  }));

  return (
    <PageTransition>
      <Link
        href="/#registry"
        className="mb-8 inline-flex items-center gap-1.5 text-sm text-muted transition-colors hover:text-accent-strong"
      >
        <ArrowLeft className="size-4" aria-hidden /> Back to home
      </Link>

      <header className="mb-10 text-center">
        <p className="text-sm uppercase tracking-[0.3em] text-accent">If you wish to give</p>
        <h1 className="mt-3 font-serif text-4xl text-foreground sm:text-5xl">Gift Registry</h1>
        <Sprig className="mx-auto mt-4 h-4 w-28 text-accent/70" />
        <p className="mx-auto mt-4 max-w-xl text-balance text-muted">
          Your presence is the truest gift. But if you&apos;d like to give more, we&apos;ve gathered
          a few things for our first home together — plus a honeymoon and house fund if you&apos;d
          rather give that way.
        </p>
      </header>

      {items.length === 0 ? (
        // Empty state (Req 5.2).
        <p className="rounded-xl border border-border bg-surface p-10 text-center text-muted">
          No registry items are available yet. Check back soon.
        </p>
      ) : (
        <>
          {/* Anonymous visitors: ask who they are before they can give. */}
          {interactive && access.tier === "public" ? <IdentifyGate /> : null}

          {claimable.length > 0 ? (
            <p className="mb-8 text-center text-sm text-muted">
              <span className="font-medium text-foreground">{available}</span> of{" "}
              <span className="font-medium text-foreground">{claimable.length}</span> gifts still
              available
              {!interactive ? " · claiming temporarily unavailable" : ""}
            </p>
          ) : null}

          <RegistryNav items={navItems} />

          <div className="space-y-10">
            {categories.map((category) => {
              const group = byCategory.get(category)!;
              const groupClaimable = group.filter((i) => !i.isFund);
              const groupAvailable = groupClaimable.filter((i) => !i.purchased).length;
              const isFundGroup = groupClaimable.length === 0;

              return (
                <section
                  key={category}
                  id={categorySlug(category)}
                  className="scroll-mt-40 sm:scroll-mt-44"
                >
                  <div className="rounded-3xl border border-border bg-surface-2/40 p-6 sm:p-8">
                    <header className="mb-8">
                      <div className="flex items-end justify-between gap-4">
                        <h2 className="font-serif text-2xl text-foreground sm:text-3xl">
                          {category}
                        </h2>
                        <span className="shrink-0 rounded-full border border-border bg-surface px-3 py-1 text-xs font-medium text-muted">
                          {isFundGroup
                            ? "Give any amount"
                            : `${groupAvailable} of ${groupClaimable.length} left`}
                        </span>
                      </div>
                      <div className="mt-3 flex items-center gap-3">
                        <span className="h-px flex-1 bg-border" aria-hidden />
                        <Sprig className="h-3.5 w-20 text-accent/60" />
                        <span className="h-px flex-1 bg-border" aria-hidden />
                      </div>
                    </header>

                    <ul className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                      {group.map((item) => (
                        <li key={item.id}>
                          <RegistryItemCard
                            item={item}
                            interactive={interactive}
                            canGive={canGive}
                          />
                        </li>
                      ))}
                    </ul>
                  </div>
                </section>
              );
            })}
          </div>
        </>
      )}
    </PageTransition>
  );
}
