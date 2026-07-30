import type { CSSProperties } from "react";

/**
 * Decorative watercolor washes scattered down the home page. Purely decorative
 * (aria-hidden) and non-interactive; the layer sits behind all page content
 * (-z-10). Splotches are placed at pseudo-random points across the full width —
 * some bleed off the edges, others drift inward behind cards and text — so the
 * arrangement feels organic rather than a strict left/right rhythm. The feathery
 * "bleeding" edges come from an SVG fractal-noise displacement filter.
 *
 * Hidden below `md` where the narrow layout leaves no room for them to sit
 * behind content without crowding text. Blobs breathe with a slow drift
 * animation; the global reduced-motion rule in globals.css disables it.
 */

type Wash = {
  /** horizontal center, as a % of page width (may sit near/over the edges) */
  x: number;
  /** vertical center, as a % of full page height */
  y: number;
  /** CSS color (theme token) */
  color: string;
  /** rendered size in rem */
  size: number;
  /** base opacity of the wash */
  opacity: number;
  /** animation timing offset + duration jitter, for un-synced drift */
  delay: number;
  dur: number;
};

// Scattered across the full width at irregular intervals. Green is weighted
// heavier than pink to match the site's "green with pinkish-red accents" theme;
// washes nearer the horizontal center run a little softer since they land behind
// text more often.
const WASHES: Wash[] = [
  { x: 3, y: 3, color: "var(--accent)", size: 17, opacity: 0.34, delay: 0, dur: 21 },
  { x: 89, y: 7, color: "var(--accent-strong)", size: 13, opacity: 0.28, delay: -6.5, dur: 25 },
  { x: 68, y: 14, color: "var(--accent)", size: 11, opacity: 0.22, delay: -3.2, dur: 19 },
  { x: 13, y: 21, color: "var(--accent)", size: 18, opacity: 0.34, delay: -9, dur: 26 },
  { x: 97, y: 27, color: "var(--accent)", size: 15, opacity: 0.3, delay: -1.8, dur: 23 },
  { x: 42, y: 33, color: "var(--accent-strong)", size: 12, opacity: 0.19, delay: -7.7, dur: 20 },
  { x: 5, y: 42, color: "var(--accent-strong)", size: 14, opacity: 0.27, delay: -4.4, dur: 24 },
  { x: 84, y: 47, color: "var(--accent)", size: 17, opacity: 0.32, delay: -11, dur: 27 },
  { x: 57, y: 54, color: "var(--accent)", size: 12, opacity: 0.21, delay: -2.6, dur: 18 },
  { x: 19, y: 61, color: "var(--accent)", size: 16, opacity: 0.32, delay: -8.3, dur: 25 },
  { x: 93, y: 67, color: "var(--accent-strong)", size: 14, opacity: 0.27, delay: -5.1, dur: 22 },
  { x: 7, y: 75, color: "var(--accent)", size: 17, opacity: 0.34, delay: -10, dur: 26 },
  { x: 65, y: 81, color: "var(--accent)", size: 13, opacity: 0.23, delay: -3.9, dur: 20 },
  { x: 31, y: 89, color: "var(--accent-strong)", size: 15, opacity: 0.26, delay: -6.9, dur: 24 },
  { x: 91, y: 95, color: "var(--accent)", size: 16, opacity: 0.33, delay: -1.2, dur: 23 },
];

export function WatercolorMargins() {
  return (
    <div
      aria-hidden
      className="pointer-events-none absolute inset-0 -z-10 hidden overflow-hidden md:block"
    >
      {WASHES.map((wash, i) => {
        const style: CSSProperties = {
          top: `${wash.y}%`,
          left: `${wash.x}%`,
          opacity: wash.opacity,
          animationDelay: `${wash.delay}s`,
          animationDuration: `${wash.dur}s`,
        };
        return (
          <div
            key={i}
            className="watercolor-blob absolute -translate-x-1/2 -translate-y-1/2"
            style={style}
          >
            <WatercolorBlob color={wash.color} seed={i * 7 + 3} size={wash.size} />
          </div>
        );
      })}
    </div>
  );
}

/**
 * A single layered watercolor splotch. Three overlapping fills at different
 * opacities give depth, and the shared displacement filter warps their edges
 * into feathery, bleeding shapes. Each instance uses a unique seed so no two
 * splotches look identical.
 */
function WatercolorBlob({
  color,
  seed,
  size,
}: {
  color: string;
  seed: number;
  size: number;
}) {
  const filterId = `watercolor-${seed}`;
  return (
    <svg
      width={`${size}rem`}
      height={`${size}rem`}
      viewBox="0 0 200 200"
      className="block"
      aria-hidden
    >
      <defs>
        <filter id={filterId} x="-50%" y="-50%" width="200%" height="200%">
          <feTurbulence
            type="fractalNoise"
            baseFrequency="0.013"
            numOctaves="4"
            seed={seed}
            result="noise"
          />
          <feDisplacementMap
            in="SourceGraphic"
            in2="noise"
            scale="58"
            xChannelSelector="R"
            yChannelSelector="G"
          />
          <feGaussianBlur stdDeviation="2" />
        </filter>
      </defs>
      <g filter={`url(#${filterId})`} fill={color}>
        <circle cx="100" cy="98" r="68" opacity="0.5" />
        <circle cx="118" cy="116" r="46" opacity="0.4" />
        <circle cx="78" cy="82" r="42" opacity="0.45" />
      </g>
    </svg>
  );
}
