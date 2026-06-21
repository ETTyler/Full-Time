"use client";

import { useMemo, useState, type ReactNode } from "react";
import type { GroupRow, GroupTable } from "@/lib/standings";

// Qualification treatment (2026: top 2 safe, 8 best 3rd-placed also go through).
function qualLeftEdge(pos: number): string {
  if (pos <= 2) return "border-l-2 border-accent/70"; // auto-qualify
  if (pos === 3) return "border-l-2 border-dotted border-gold/50"; // in contention
  return "border-l-2 border-transparent";
}

function Stat({ children }: { children: ReactNode }) {
  return (
    <span className="hidden w-[3.4rem] shrink-0 text-right tabular-nums text-muted sm:inline">
      {children}
    </span>
  );
}

function Row({
  row,
  pos,
  isLast,
  owned,
}: {
  row: GroupRow;
  pos: number;
  isLast: boolean;
  owned: boolean;
}) {
  const out = row.team.eliminated;
  // A gold hairline under 2nd place draws the qualification cut-off.
  const divider = isLast
    ? ""
    : pos === 2
      ? "border-b border-gold/35"
      : "border-b border-line";

  return (
    <div
      className={`flex items-center gap-2 py-1.5 pl-1.5 ${qualLeftEdge(pos)} ${divider}`}
    >
      <span className="w-3.5 shrink-0 text-right text-xs tabular-nums text-muted">
        {pos}
      </span>
      <span
        className={`flex min-w-0 flex-1 items-center gap-1.5 ${
          out ? "opacity-55" : ""
        }`}
      >
        <span className="shrink-0">{row.team.flag}</span>
        <span
          className={`truncate text-sm ${
            owned ? "foil-underline font-semibold" : ""
          }`}
        >
          {row.team.name}
        </span>
        {out && (
          <span className="shrink-0 rounded border border-danger/40 px-1 text-[0.6rem] font-bold uppercase tracking-wider text-danger">
            Out
          </span>
        )}
      </span>

      <Stat>
        {row.played} {row.won} {row.drawn} {row.lost}
      </Stat>
      <Stat>
        {row.gf}:{row.ga}
      </Stat>
      <span className="w-7 shrink-0 text-right text-xs tabular-nums text-muted">
        {row.gd > 0 ? `+${row.gd}` : row.gd}
      </span>
      <span className="w-5 shrink-0 text-right text-sm font-semibold tabular-nums text-gold">
        {row.points}
      </span>
    </div>
  );
}

function GroupCard({
  table,
  ownedIds,
}: {
  table: GroupTable;
  ownedIds: Set<string>;
}) {
  return (
    <div className="card px-3 pb-2.5 pt-2.5">
      <div className="mb-1.5 flex items-baseline justify-between">
        <span className="text-sm font-medium">Group {table.name}</span>
        <span className="hidden text-[0.6rem] uppercase tracking-wider text-muted sm:inline">
          P W D L · GF:GA · GD · Pts
        </span>
        <span className="text-[0.6rem] uppercase tracking-wider text-muted sm:hidden">
          GD · Pts
        </span>
      </div>
      {table.rows.map((row, i) => (
        <Row
          key={row.team.id}
          row={row}
          pos={i + 1}
          isLast={i === table.rows.length - 1}
          owned={ownedIds.has(row.team.id)}
        />
      ))}
    </div>
  );
}

export function GroupTables({
  tables,
  ownedTeamIds = [],
}: {
  tables: GroupTable[];
  /** When provided, defaults to showing only the viewer's groups. */
  ownedTeamIds?: string[];
}) {
  const ownedIds = useMemo(() => new Set(ownedTeamIds), [ownedTeamIds]);
  const hasOwned = ownedIds.size > 0;
  const [showAll, setShowAll] = useState(!hasOwned);

  const yourGroups = useMemo(
    () =>
      tables.filter((t) => t.rows.some((r) => ownedIds.has(r.team.id))),
    [tables, ownedIds],
  );

  const visible = showAll || !hasOwned ? tables : yourGroups;

  return (
    <div>
      <div className="mb-2 flex items-center justify-between gap-3">
        <span className="text-xs text-muted">
          {hasOwned && !showAll
            ? `your groups · ${yourGroups.length} of ${tables.length}`
            : `${tables.length} groups`}
        </span>
        {hasOwned && (
          <button
            type="button"
            onClick={() => setShowAll((s) => !s)}
            className="text-xs font-medium text-muted transition-colors hover:text-fg"
          >
            {showAll ? "Show your groups" : "Show all groups"}
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
        {visible.map((table) => (
          <GroupCard key={table.name} table={table} ownedIds={ownedIds} />
        ))}
      </div>

      <div className="mt-2.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-[0.65rem] text-muted">
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-3 w-0.5 bg-accent/70" />
          auto-qualify (top 2)
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-3 border-l-2 border-dotted border-gold/70" />
          best-third contention
        </span>
        {hasOwned && (
          <span className="flex items-center gap-1.5">
            <span className="foil-underline text-fg">name</span> = your team
          </span>
        )}
      </div>
    </div>
  );
}
