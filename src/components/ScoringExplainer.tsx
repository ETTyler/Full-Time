import { STAGE_LABELS, STAGE_ORDER, STAGE_POINTS } from "@/lib/scoring";

/**
 * Compact explainer of the points system: each team scores for the
 * furthest stage it reaches (not added up round by round).
 */
export function ScoringExplainer() {
  return (
    <div>
      <p className="text-sm text-muted">
        Each of your teams scores points for the furthest stage it reaches —
        one score per team, not added up round by round. Your total is the sum
        across all your teams.
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
    </div>
  );
}
