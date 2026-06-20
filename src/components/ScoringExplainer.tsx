import {
  BONUS_POINTS,
  GIANT_KILL_GAP,
  STAGE_LABELS,
  STAGE_ORDER,
  STAGE_POINTS,
} from "@/lib/scoring";

const BONUSES: { points: number; label: string }[] = [
  { points: BONUS_POINTS.groupWin, label: "group-stage win" },
  { points: BONUS_POINTS.groupDraw, label: "group-stage draw" },
  {
    points: BONUS_POINTS.giantKill,
    label: `giant-killing — beating a team ranked ${GIANT_KILL_GAP}+ FIFA places higher (group stage)`,
  },
  {
    points: BONUS_POINTS.giantKillKo,
    label: `giant-killing in a knockout match — worth more`,
  },
  {
    points: BONUS_POINTS.giantHold,
    label: `giant-held — holding such a team to a group-stage draw`,
  },
  { points: BONUS_POINTS.bronze, label: "winning the third-place match" },
];

/**
 * Compact explainer of the points system: each team scores for the
 * furthest stage it reaches (not added up round by round).
 */
export function ScoringExplainer() {
  return (
    <div>
      <p className="text-sm text-muted">
        Each of your teams scores points for the furthest stage it reaches —
        one score per team, not added up round by round — plus live match
        bonuses as results come in. Your total is the sum across all your
        teams.
      </p>
      <div className="mt-3 grid grid-cols-4 gap-2 sm:grid-cols-7">
        {STAGE_ORDER.map((stage) => {
          const isChampion = stage === "CHAMPION";
          return (
            <div
              key={stage}
              className={`card flex flex-col items-center gap-0.5 px-2 py-2.5 text-center ${
                isChampion ? "border-gold/40" : ""
              }`}
            >
              <span className="text-[0.65rem] leading-tight text-muted">
                {STAGE_LABELS[stage]}
              </span>
              <span
                className={`text-base font-semibold tabular-nums ${
                  isChampion ? "text-gold" : "text-accent-strong"
                }`}
              >
                {STAGE_POINTS[stage]}
              </span>
            </div>
          );
        })}
      </div>
      <ul className="mt-3 space-y-1">
        {BONUSES.map((b) => (
          <li key={b.label} className="flex items-baseline gap-2 text-xs">
            <span className="w-7 shrink-0 text-right font-semibold tabular-nums text-gold">
              +{b.points}
            </span>
            <span className="text-muted">{b.label}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
