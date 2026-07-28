"use client";

import { useEffect, useState } from "react";

interface Remaining {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

function diff(target: number): Remaining | null {
  const ms = target - Date.now();
  if (ms <= 0) return null;
  return {
    days: Math.floor(ms / 86_400_000),
    hours: Math.floor((ms / 3_600_000) % 24),
    minutes: Math.floor((ms / 60_000) % 60),
    seconds: Math.floor((ms / 1000) % 60),
  };
}

/** Live countdown to the wedding date. `dateISO` is a placeholder until set. */
export function Countdown({ dateISO }: { dateISO: string }) {
  const target = new Date(dateISO).getTime();
  const [remaining, setRemaining] = useState<Remaining | null>(null);

  useEffect(() => {
    if (Number.isNaN(target)) return;
    // Set the first value on the next frame (a callback, not synchronously in the
    // effect body) so the server-rendered placeholder hydrates without mismatch.
    const raf = requestAnimationFrame(() => setRemaining(diff(target)));
    const interval = setInterval(() => setRemaining(diff(target)), 1000);
    return () => {
      cancelAnimationFrame(raf);
      clearInterval(interval);
    };
  }, [target]);

  if (Number.isNaN(target)) return null;

  const units: [string, number | undefined][] = [
    ["Days", remaining?.days],
    ["Hours", remaining?.hours],
    ["Minutes", remaining?.minutes],
    ["Seconds", remaining?.seconds],
  ];

  return (
    <div
      className="flex items-center justify-center gap-3 sm:gap-6"
      aria-label="Countdown to the wedding"
    >
      {units.map(([label, value]) => (
        <div key={label} className="flex flex-col items-center">
          <span className="font-serif text-3xl tabular-nums text-accent-strong sm:text-5xl">
            {/* Render a stable placeholder until the client interval starts (avoids hydration mismatch). */}
            {value === undefined ? "—" : String(value).padStart(2, "0")}
          </span>
          <span className="mt-1 text-xs uppercase tracking-[0.2em] text-muted">{label}</span>
        </div>
      ))}
    </div>
  );
}
