"use client";

import { useState, type ReactNode } from "react";

export function AdminTabs({
  tabs,
}: {
  tabs: { label: string; content: ReactNode }[];
}) {
  const [active, setActive] = useState(0);

  return (
    <div>
      <div
        role="tablist"
        className="flex gap-1 border-b border-line"
      >
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
      {/* Keep inactive tabs mounted so in-progress form edits survive switching. */}
      {tabs.map((tab, i) => (
        <div key={tab.label} className={i === active ? "pt-5" : "hidden"}>
          {tab.content}
        </div>
      ))}
    </div>
  );
}
