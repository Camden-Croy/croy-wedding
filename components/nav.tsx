"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Heart } from "lucide-react";
import { WEDDING } from "@/lib/content";

const LINKS = [
  { id: "story", label: "Our Story" },
  { id: "details", label: "Details" },
  { id: "gallery", label: "Gallery" },
  { id: "registry", label: "Registry" },
  { id: "rsvp", label: "RSVP" },
] as const;

export function Nav() {
  const pathname = usePathname();
  const onHome = pathname === "/";
  const [activeSection, setActiveSection] = useState<string | null>(null);

  useEffect(() => {
    if (!onHome) return;
    const sections = LINKS.map((l) => document.getElementById(l.id)).filter(
      (el): el is HTMLElement => el !== null,
    );
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) setActiveSection(entry.target.id);
        }
      },
      // Trigger when a section occupies the middle band of the viewport.
      { rootMargin: "-45% 0px -50% 0px", threshold: 0 },
    );
    sections.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, [onHome]);

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur">
      <nav
        aria-label="Primary"
        className="mx-auto flex max-w-5xl flex-col items-center gap-3 px-5 py-4 sm:flex-row sm:justify-between sm:gap-4"
      >
        {/* Anchors resolve from any page: on the home page they smooth-scroll,
            from a dedicated page they navigate home and then to the section. */}
        <Link href="/#top" className="flex items-center gap-2 text-accent-strong">
          <Heart className="size-5" aria-hidden />
          <span className="font-serif text-lg">{WEDDING.initials}</span>
        </Link>

        <ul className="flex flex-wrap items-center justify-center gap-1 sm:gap-2">
          {LINKS.map((link) => {
            const active = onHome && activeSection === link.id;
            return (
              <li key={link.id}>
                <Link
                  href={`/#${link.id}`}
                  aria-current={active ? "true" : undefined}
                  className={
                    "rounded-full px-3 py-1.5 text-sm transition-colors sm:px-4 " +
                    (active
                      ? "bg-surface-2 text-accent-strong"
                      : "text-muted hover:text-foreground")
                  }
                >
                  {link.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </header>
  );
}
