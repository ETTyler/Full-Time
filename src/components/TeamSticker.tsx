"use client";

import { useState } from "react";
import type { Team } from "@prisma/client";
import { STAGE_LABELS, pointsFor, type BonusLine } from "@/lib/scoring";

export function TeamSticker({
  team,
  bonus = 0,
  breakdown = [],
}: {
  team: Team;
  bonus?: number;
  breakdown?: BonusLine[];
}) {
  const [open, setOpen] = useState(false);
  const out = team.eliminated;
  const stagePoints = pointsFor(team.stage);
  const total = stagePoints + bonus;
  // Only worth expanding if there's something to itemise.
  const hasDetail = bonus > 0 || stagePoints > 0;

  const toggle = () => hasDetail && setOpen((o) => !o);

  return (
    <div
      role={hasDetail ? "button" : undefined}
      tabIndex={hasDetail ? 0 : undefined}
      onClick={toggle}
      onKeyDown={(e) => {
        if (hasDetail && (e.key === "Enter" || e.key === " ")) {
          e.preventDefault();
          toggle();
        }
      }}
      aria-expanded={hasDetail ? open : undefined}
      className={`card block w-full p-3 text-left ${out ? "opacity-50" : "foil-edge"} ${
        hasDetail ? "cursor-pointer transition-colors hover:bg-fg/[0.03]" : ""
      }`}
    >
      <div className="flex items-start justify-between">
        <span className="text-xl leading-none">{team.flag}</span>
        {out && (
          <span className="rounded border border-danger/40 px-1 text-[0.6rem] font-bold uppercase tracking-wider text-danger">
            Out
          </span>
        )}
      </div>
      <div className="mt-2 truncate text-sm font-medium">{team.name}</div>
      <div className="mt-1 flex items-center justify-between gap-1 text-xs">
        <span className="truncate text-muted">
          {team.groupName} · {STAGE_LABELS[team.stage]}
        </span>
        <span className="flex shrink-0 items-center gap-1">
          <span className="font-semibold tabular-nums text-accent">
            {total}
            {bonus > 0 && (
              <span className="ml-0.5 text-[0.65rem] font-medium text-gold">
                +{bonus}
              </span>
            )}
          </span>
          {hasDetail && (
            <svg
              viewBox="0 0 16 16"
              aria-hidden
              className={`h-3.5 w-3.5 text-muted transition-transform ${
                open ? "rotate-180" : ""
              }`}
            >
              <path
                d="M4 6l4 4 4-4"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          )}
        </span>
      </div>

      {hasDetail && open && (
        <dl className="mt-2.5 space-y-1 border-t border-line pt-2 text-xs">
          <div className="flex items-baseline justify-between gap-2">
            <dt className="truncate text-muted">
              {STAGE_LABELS[team.stage]}
              {stagePoints === 0 && (
                <span className="ml-1 text-[0.65rem]">(no stage points yet)</span>
              )}
            </dt>
            <dd className="shrink-0 font-semibold tabular-nums text-accent">
              {stagePoints}
            </dd>
          </div>
          {breakdown.map((line) => (
            <div
              key={line.kind}
              className="flex items-baseline justify-between gap-2"
            >
              <dt className="truncate text-muted">
                {line.label}
                {line.count > 1 && (
                  <span className="ml-1 text-[0.65rem] tabular-nums">
                    ×{line.count}
                  </span>
                )}
              </dt>
              <dd className="shrink-0 font-semibold tabular-nums text-gold">
                +{line.points}
              </dd>
            </div>
          ))}
          <div className="flex items-baseline justify-between gap-2 border-t border-line pt-1">
            <dt className="font-medium">Total</dt>
            <dd className="shrink-0 font-semibold tabular-nums text-accent-strong">
              {total}
            </dd>
          </div>
        </dl>
      )}
    </div>
  );
}
