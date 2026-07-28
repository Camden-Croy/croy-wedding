import Link from "next/link";
import { ArrowRight, ArrowUpRight, Check, Gift } from "lucide-react";
import { Reveal } from "@/components/reveal";
import { SectionHeader } from "@/components/section-header";
import { formatPrice, REGISTRY_ITEMS, type RegistryItem } from "@/lib/content";
import { getRegistryItems } from "@/lib/data";

interface FeaturedGift {
  id: string;
  title: string;
  description: string;
  category: string;
  priceCents: number | null;
  isFund: boolean;
  purchased: boolean;
}

/** Load a few gifts to preview, preferring still-available ones. DB with fallback. */
async function loadFeatured(): Promise<FeaturedGift[]> {
  let gifts: FeaturedGift[];
  try {
    const rows = await getRegistryItems();
    gifts = rows.map((r) => ({
      id: r.id,
      title: r.title,
      description: r.description,
      category: r.category ?? "Gifts",
      priceCents: r.priceCents ?? null,
      isFund: r.isFund,
      // Derive from the claim relation so it can't drift from a stale flag.
      purchased: r.claimedById !== null,
    }));
  } catch {
    gifts = REGISTRY_ITEMS.map((r: RegistryItem) => ({
      id: r.id,
      title: r.title,
      description: r.description,
      category: r.category,
      priceCents: r.priceCents ?? null,
      isFund: r.isFund ?? false,
      purchased: r.purchased ?? false,
    }));
  }

  // Prefer available, non-fund gifts for the teaser, but keep original order.
  const available = gifts.filter((g) => !g.isFund && !g.purchased);
  const rest = gifts.filter((g) => g.isFund || g.purchased);
  return [...available, ...rest].slice(0, 3);
}

/** Featured preview of the registry; full list lives on /registry. */
export async function FeaturedRegistrySection() {
  const featured = await loadFeatured();

  return (
    <section id="registry" className="scroll-mt-32 border-t border-border py-20 sm:py-28">
      <div className="mx-auto max-w-5xl px-5">
        <Reveal>
          <SectionHeader
            eyebrow="If you wish to give"
            title="Registry"
            subtitle="Your presence is the gift — but if you'd like to give more, here are a few ideas."
          />
        </Reveal>

        <Reveal>
          <ul className="mx-auto grid max-w-4xl grid-cols-1 gap-5 sm:grid-cols-3">
            {featured.map((item) => {
              const price = formatPrice(item.priceCents);
              return (
                <li key={item.id}>
                  <Link
                    href={`/registry#${item.id}`}
                    className="card card--link group flex h-full flex-col p-6 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-strong"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-surface-2 px-3 py-1 text-xs font-medium text-accent">
                        <Gift className="size-3.5" aria-hidden />
                        {item.category}
                      </span>
                      {item.purchased ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-accent/15 px-2.5 py-1 text-xs font-medium text-accent">
                          <Check className="size-3.5" aria-hidden /> Reserved
                        </span>
                      ) : price ? (
                        <span className="rounded-full bg-accent/10 px-2.5 py-1 text-sm font-semibold text-accent-strong">
                          {price}
                        </span>
                      ) : item.isFund ? (
                        <span className="rounded-full bg-accent/10 px-2.5 py-1 text-xs font-medium text-accent-strong">
                          Any amount
                        </span>
                      ) : null}
                    </div>

                    <h3 className="mt-4 font-serif text-xl leading-snug text-foreground">
                      {item.title}
                    </h3>
                    <p className="mt-2 flex-1 text-sm leading-relaxed text-muted">
                      {item.description}
                    </p>

                    <span className="mt-5 inline-flex items-center gap-1.5 text-sm font-medium text-accent-strong">
                      {item.purchased ? "View registry" : "View & claim"}
                      <ArrowUpRight
                        className="size-4 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
                        aria-hidden
                      />
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </Reveal>

        <div className="mt-8 text-center">
          <Link
            href="/registry"
            className="inline-flex items-center gap-1.5 rounded-full border border-border px-6 py-2.5 text-sm text-foreground transition-colors hover:border-accent hover:text-accent-strong"
          >
            View full registry <ArrowRight className="size-4" aria-hidden />
          </Link>
        </div>
      </div>
    </section>
  );
}
