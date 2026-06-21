"use client";

import { useMemo, useState, type ReactNode } from "react";
import type { GroupRow, GroupTable } from "@/lib/standings";

// Qualification treatment (2026: top 2 safe, 8 best 3rd-placed also go through).
function qualLeftEdge(pos: number): string {
  if (pos <= 2) return "border-l-2 border-accent/70"; // auto-qualify
  if (pos === 3) return "border-l-2 border-dotted border-gold/50"; // in contention
  return "border-l-2 border-transparent";
}

// Shared column widths so the header labels line up over every row's numbers.
// W/D/L and GF:GA are desktop-only — mobile keeps it simple: Pl · GD · Pts.
const COL = {
  pos: "w-3.5",
  pl: "w-5",
  wdl: "w-4",
  gfga: "w-11",
  gd: "w-7",
  pts: "w-6",
} as const;

const WIDE = "hidden sm:block"; // columns shown only from the sm breakpoint up

/** A right-aligned, fixed-width cell — header or number share the same widths. */
function Cell({
  width,
  wide,
  header,
  children,
}: {
  width: string;
  wide?: boolean;
  header?: boolean;
  children: ReactNode;
}) {
  return (
    <span
      className={`${width} shrink-0 text-right tabular-nums ${
        wide ? WIDE : ""
      } ${header ? "text-[0.6rem] font-medium uppercase tracking-wider" : "text-xs"} text-muted`}
    >
      {children}
    </span>
  );
}

function HeaderRow() {
  return (
    <div className="flex items-center gap-x-1.5 border-l-2 border-transparent pb-1 pl-1.5">
      <span className={`${COL.pos} shrink-0`} />
      <span className="min-w-0 flex-1" />
      <Cell width={COL.pl} header>
        Pl
      </Cell>
      <Cell width={COL.wdl} wide header>
        W
      </Cell>
      <Cell width={COL.wdl} wide header>
        D
      </Cell>
      <Cell width={COL.wdl} wide header>
        L
      </Cell>
      <Cell width={COL.gfga} wide header>
        GF:GA
      </Cell>
      <Cell width={COL.gd} header>
        GD
      </Cell>
      <Cell width={COL.pts} header>
        Pts
      </Cell>
    </div>
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
      className={`flex items-center gap-x-1.5 py-1.5 pl-1.5 ${qualLeftEdge(pos)} ${divider}`}
    >
      <span
        className={`${COL.pos} shrink-0 text-right text-xs tabular-nums text-muted`}
      >
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

      <Cell width={COL.pl}>{row.played}</Cell>
      <Cell width={COL.wdl} wide>
        {row.won}
      </Cell>
      <Cell width={COL.wdl} wide>
        {row.drawn}
      </Cell>
      <Cell width={COL.wdl} wide>
        {row.lost}
      </Cell>
      <Cell width={COL.gfga} wide>
        {row.gf}:{row.ga}
      </Cell>
      <Cell width={COL.gd}>{row.gd > 0 ? `+${row.gd}` : row.gd}</Cell>
      <span
        className={`${COL.pts} shrink-0 text-right text-sm font-semibold tabular-nums text-gold`}
      >
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
      <div className="mb-1 text-sm font-medium">Group {table.name}</div>
      <HeaderRow />
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
    () => tables.filter((t) => t.rows.some((r) => ownedIds.has(r.team.id))),
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
