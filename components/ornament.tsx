/**
 * Decorative line-art shapes used to add structure and theme (a chapel-style
 * arch, and a small botanical sprig divider). All inherit `currentColor` so the
 * caller controls color/opacity. Purely decorative (aria-hidden).
 */

/** A tall chapel/window arch outline — used as a layered frame behind imagery. */
export function ArchOutline({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 220 300"
      fill="none"
      preserveAspectRatio="none"
      className={className}
      aria-hidden
    >
      <path
        d="M6 300 V116 C6 58 52 12 110 12 C168 12 214 58 214 116 V300"
        stroke="currentColor"
        strokeWidth="1.5"
      />
    </svg>
  );
}

/**
 * A hand-drawn ink underline — a slightly irregular double stroke that reads as
 * a brush/pen flourish beneath a heading. Inherits currentColor.
 */
export function InkUnderline({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 200 20"
      fill="none"
      preserveAspectRatio="none"
      className={className}
      aria-hidden
    >
      {/* main sweeping stroke */}
      <path
        d="M4 12 C40 5 78 5 110 8 C140 11 172 12 196 7"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
      {/* lighter trailing stroke for a inked, layered look */}
      <path
        d="M14 16 C52 12 96 13 140 14 C160 14.5 178 14 190 12.5"
        stroke="currentColor"
        strokeWidth="1.25"
        strokeLinecap="round"
        opacity="0.55"
      />
    </svg>
  );
}

/** A small symmetric botanical sprig, centered — a section-header flourish. */
export function Sprig({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 140 28"
      fill="none"
      className={className}
      aria-hidden
    >
      {/* center stem line */}
      <path d="M20 14 H120" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" />
      {/* left leaves */}
      <path d="M60 14 C50 6 40 6 34 10 C42 14 52 14 60 14 Z" fill="currentColor" opacity="0.9" />
      <path d="M52 14 C44 20 36 20 31 17 C38 13 46 12 52 14 Z" fill="currentColor" opacity="0.7" />
      {/* right leaves (mirrored) */}
      <path d="M80 14 C90 6 100 6 106 10 C98 14 88 14 80 14 Z" fill="currentColor" opacity="0.9" />
      <path d="M88 14 C96 20 104 20 109 17 C102 13 94 12 88 14 Z" fill="currentColor" opacity="0.7" />
      {/* center bud */}
      <circle cx="70" cy="14" r="3.2" fill="currentColor" />
    </svg>
  );
}
