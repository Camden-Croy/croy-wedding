"use client";

import { useState } from "react";

export interface DashboardTab {
  key: string;
  label: string;
  /** Optional count shown as a pill next to the label. */
  count?: number;
  /** Server-rendered panel content, passed down as a prop. */
  content: React.ReactNode;
}

/**
 * Simple accessible tab switcher for the admin dashboard. Panels are rendered
 * on the server and handed in as `content`; this client component only tracks
 * which one is visible so the page isn't a single long scroll.
 */
export function DashboardTabs({ tabs }: { tabs: DashboardTab[] }) {
  const [active, setActive] = useState(tabs[0]?.key ?? "");
  const current = tabs.find((t) => t.key === active) ?? tabs[0];

  return (
    <div>
      <div
        role="tablist"
        aria-label="Dashboard sections"
        className="mb-8 flex flex-wrap gap-1 border-b border-border"
      >
        {tabs.map((tab) => {
          const selected = tab.key === current?.key;
          return (
            <button
              key={tab.key}
              role="tab"
              id={`tab-${tab.key}`}
              aria-selected={selected}
              aria-controls={`panel-${tab.key}`}
              onClick={() => setActive(tab.key)}
              className={
                "-mb-px inline-flex items-center gap-2 border-b-2 px-4 py-2.5 text-sm font-medium transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-strong " +
                (selected
                  ? "border-accent text-foreground"
                  : "border-transparent text-muted hover:text-foreground")
              }
            >
              {tab.label}
              {tab.count != null ? (
                <span
                  className={
                    "rounded-full px-2 py-0.5 text-xs font-medium " +
                    (selected ? "bg-accent/15 text-accent" : "bg-surface-2 text-muted")
                  }
                >
                  {tab.count}
                </span>
              ) : null}
            </button>
          );
        })}
      </div>

      {tabs.map((tab) => (
        <div
          key={tab.key}
          role="tabpanel"
          id={`panel-${tab.key}`}
          aria-labelledby={`tab-${tab.key}`}
          hidden={tab.key !== current?.key}
        >
          {tab.key === current?.key ? tab.content : null}
        </div>
      ))}
    </div>
  );
}
