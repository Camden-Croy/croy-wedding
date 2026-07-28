import { Sprig } from "@/components/ornament";

export function SectionHeader({
  eyebrow,
  title,
  subtitle,
  as: Heading = "h2",
}: {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  /** Heading level — use "h1" on dedicated pages, "h2" for sections. */
  as?: "h1" | "h2";
}) {
  return (
    <header className="mb-10 text-center">
      {eyebrow ? (
        <p className="text-sm uppercase tracking-[0.3em] text-accent">{eyebrow}</p>
      ) : null}
      <Heading className="mt-3 font-serif text-4xl text-foreground sm:text-5xl">
        {title}
      </Heading>
      <Sprig className="mx-auto mt-4 h-4 w-28 text-accent/70" />
      {subtitle ? (
        <p className="mx-auto mt-4 max-w-xl text-balance text-muted">{subtitle}</p>
      ) : null}
    </header>
  );
}
