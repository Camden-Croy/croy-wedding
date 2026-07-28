"use client";

import { useEffect, useState } from "react";

export interface RegistryNavItem {
  /** DOM id of the category section this pill jumps to. */
  slug: string;
  label: string;
  count: number;
}

/**
 * Sticky category navigation for the registry. Renders a scrollable pill row
 * and highlights the section currently in view via IntersectionObserver, the
 * same pattern the site nav uses for home-page sections.
 *
 * Sticky only kicks in at sm+ where the site header is a single predictable
 * row; on mobile it sits inline so it can't hide behind the taller header.
 */
export function RegistryNav({ items }: { items: RegistryNavItem[] }) {
  const [active, setActive] = useState<string>(items[0]?.slug ?? "");

  useEffect(() => {
    const sections = items
      .map((i) => document.getElementById(i.slug))
      .filter((el): el is HTMLElement => el !== null);

    const observer = new IntersectionObserver(
      (entries) => {
        // Highlight the topmost section currently intersecting the band.
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible[0]) setActive(visible[0].target.id);
      },
      { rootMargin: "-140px 0px -55% 0px", threshold: 0 },
    );

    sections.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, [items]);

  if (items.length <= 1) return null;

  return (
    <nav
      aria-label="Registry categories"
      className="relative z-30 mb-12 sm:sticky sm:top-[76px]"
    >
      <ul className="flex gap-1.5 overflow-x-auto rounded-full border border-border bg-background/85 p-1.5 shadow-sm backdrop-blur [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {items.map((item) => {
          const isActive = item.slug === active;
          return (
            <li key={item.slug} className="shrink-0">
              <a
                href={`#${item.slug}`}
                aria-current={isActive ? "true" : undefined}
                onClick={() => setActive(item.slug)}
                className={
                  "inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-medium transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-strong " +
                  (isActive
                    ? "bg-accent text-background"
                    : "text-muted hover:bg-surface-2 hover:text-foreground")
                }
              >
                {item.label}
                <span
                  className={
                    "rounded-full px-1.5 text-xs font-semibold " +
                    (isActive ? "bg-background/25 text-background" : "bg-surface-2 text-muted")
                  }
                >
                  {item.count}
                </span>
              </a>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
