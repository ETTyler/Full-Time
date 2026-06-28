"use client";

import { useState, type ReactNode } from "react";

/**
 * Generic tab switcher. Inactive panels stay mounted (hidden) so any
 * in-progress interaction or scroll position survives switching tabs.
 */
export function Tabs({
  tabs,
  defaultIndex = 0,
}: {
  tabs: { label: string; content: ReactNode }[];
  defaultIndex?: number;
}) {
  const [active, setActive] = useState(defaultIndex);

  return (
    <div>
      <div role="tablist" className="flex gap-1 border-b border-line">
        {tabs.map((tab, i) => (
          <button
            key={tab.label}
            role="tab"
            aria-selected={i === active}
            onClick={() => setActive(i)}
            className={`-mb-px rounded-t-lg border-b-2 px-4 py-2 text-sm font-medium transition-colors ${
              i === active
                ? "border-accent text-fg"
                : "border-transparent text-muted hover:text-fg"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>
      {tabs.map((tab, i) => (
        <div key={tab.label} className={i === active ? "pt-6" : "hidden"}>
          {tab.content}
        </div>
      ))}
    </div>
  );
}
