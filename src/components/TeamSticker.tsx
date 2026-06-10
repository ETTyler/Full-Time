import type { Team } from "@prisma/client";
import { STAGE_LABELS, pointsFor } from "@/lib/scoring";

export function TeamSticker({ team }: { team: Team }) {
  const out = team.eliminated;
  return (
    <div className={`card p-3 ${out ? "opacity-50" : ""}`}>
      <div className="flex items-start justify-between">
        <span className="text-xl leading-none">{team.flag}</span>
        {out && (
          <span className="text-[0.65rem] font-medium uppercase tracking-wide text-danger">
            Out
          </span>
        )}
      </div>
      <div className="mt-2 truncate text-sm font-medium">{team.name}</div>
      <div className="mt-1 flex items-center justify-between text-xs">
        <span className="text-muted">
          {team.groupName} · {STAGE_LABELS[team.stage]}
        </span>
        <span className="font-semibold tabular-nums text-accent">
          {pointsFor(team.stage)}
        </span>
      </div>
    </div>
  );
}
