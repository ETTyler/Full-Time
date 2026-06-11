import type { Team } from "@prisma/client";
import { STAGE_LABELS, pointsFor } from "@/lib/scoring";

export function TeamSticker({
  team,
  bonus = 0,
}: {
  team: Team;
  bonus?: number;
}) {
  const out = team.eliminated;
  return (
    <div className={`card p-3 ${out ? "opacity-50" : "foil-edge"}`}>
      <div className="flex items-start justify-between">
        <span className="text-xl leading-none">{team.flag}</span>
        {out && (
          <span className="rounded border border-danger/40 px-1 text-[0.6rem] font-bold uppercase tracking-wider text-danger">
            Out
          </span>
        )}
      </div>
      <div className="mt-2 truncate text-sm font-medium">{team.name}</div>
      <div className="mt-1 flex items-center justify-between text-xs">
        <span className="truncate text-muted">
          {team.groupName} · {STAGE_LABELS[team.stage]}
        </span>
        <span
          className="ml-1 shrink-0 font-semibold tabular-nums text-accent"
          title={
            bonus > 0
              ? `${pointsFor(team.stage)} stage + ${bonus} bonus`
              : undefined
          }
        >
          {pointsFor(team.stage) + bonus}
          {bonus > 0 && (
            <span className="ml-0.5 text-[0.65rem] font-medium text-gold">
              +{bonus}
            </span>
          )}
        </span>
      </div>
    </div>
  );
}
