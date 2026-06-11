"use client";

import { useState } from "react";
import type { Pick, Team, User } from "@prisma/client";
import { pointsFor } from "@/lib/scoring";
import { TeamSticker } from "@/components/TeamSticker";

type PickWithRelations = Pick & { team: Team; user: User };

export function Leaderboard({
  picks,
  currentUserId,
  bonusPoints = {},
}: {
  picks: PickWithRelations[];
  currentUserId: string;
  bonusPoints?: Record<string, number>;
}) {
  const [openUserId, setOpenUserId] = useState<string | null>(null);

  const rows = new Map<
    string,
    {
      name: string;
      points: number;
      alive: number;
      total: number;
      picks: PickWithRelations[];
    }
  >();

  for (const p of picks) {
    const row = rows.get(p.userId) ?? {
      name: p.user.username ?? p.user.name ?? "—",
      points: 0,
      alive: 0,
      total: 0,
      picks: [],
    };
    row.points += pointsFor(p.team.stage) + (bonusPoints[p.teamId] ?? 0);
    row.total += 1;
    if (!p.team.eliminated) row.alive += 1;
    row.picks.push(p);
    rows.set(p.userId, row);
  }

  const sorted = [...rows.entries()].sort(
    (a, b) => b[1].points - a[1].points || b[1].alive - a[1].alive,
  );

  return (
    <ol className="divide-y divide-line">
      {sorted.map(([userId, row], i) => {
        const isYou = userId === currentUserId;
        const isOpen = openUserId === userId;

        return (
          <li key={userId}>
            <button
              onClick={() => setOpenUserId(isOpen ? null : userId)}
              aria-expanded={isOpen}
              className="flex w-full items-center gap-4 px-1 py-3.5 text-left transition-colors hover:bg-fg/[0.03] sm:px-2"
            >
              <span
                className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs tabular-nums ${
                  i === 0
                    ? "bg-gold font-semibold text-[#1a1206]"
                    : "bg-card-2 text-muted"
                }`}
              >
                {i + 1}
              </span>

              <span className="min-w-0 flex-1">
                <span className="block truncate font-medium">
                  <span className={isYou ? "foil-underline" : ""}>
                    {row.name}
                  </span>
                  {isYou && (
                    <span className="ml-2 text-xs font-normal text-muted">
                      you
                    </span>
                  )}
                </span>
                <span className="mt-0.5 block text-xs tabular-nums text-muted">
                  {row.alive} of {row.total} still in
                </span>
              </span>

              <span
                className={`text-right text-base font-semibold tabular-nums ${
                  i === 0 ? "text-gold" : "text-accent-strong"
                }`}
              >
                {row.points}
                <span className="ml-1 text-xs font-normal text-muted">pts</span>
              </span>

              <svg
                viewBox="0 0 16 16"
                aria-hidden
                className={`h-4 w-4 shrink-0 text-muted transition-transform ${
                  isOpen ? "rotate-180" : ""
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
            </button>

            {isOpen && (
              <div className="grid grid-cols-2 gap-2 px-1 pb-4 pt-1 sm:grid-cols-3 sm:px-2">
                {[...row.picks]
                  .sort((a, b) =>
                    a.team.groupName.localeCompare(b.team.groupName),
                  )
                  .map((p, j) => (
                    <div
                      key={p.id}
                      className="fade-up"
                      style={{ animationDelay: `${j * 25}ms` }}
                    >
                      <TeamSticker
                        team={p.team}
                        bonus={bonusPoints[p.teamId] ?? 0}
                      />
                    </div>
                  ))}
              </div>
            )}
          </li>
        );
      })}
    </ol>
  );
}
