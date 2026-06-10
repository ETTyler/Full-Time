import type { Stage } from "@prisma/client";

/**
 * Points awarded for the FURTHEST stage a team reaches (not additive —
 * each value already includes credit for everything before it).
 * Tweak these to taste; the leaderboard recomputes automatically.
 *
 * 2026 format: 12 groups of 4 → top two + 8 best third-placed
 * teams reach the Round of 32, then R16, QF, SF, Final.
 */
export const STAGE_POINTS: Record<Stage, number> = {
  GROUP: 0,
  R32: 4,
  R16: 10,
  QF: 20,
  SF: 35,
  RUNNER_UP: 50,
  CHAMPION: 80,
};

export const STAGE_LABELS: Record<Stage, string> = {
  GROUP: "Group stage",
  R32: "Round of 32",
  R16: "Round of 16",
  QF: "Quarter-final",
  SF: "Semi-final",
  RUNNER_UP: "Runner-up",
  CHAMPION: "Champion",
};

// Order used by the admin panel and progress meters.
export const STAGE_ORDER: Stage[] = [
  "GROUP",
  "R32",
  "R16",
  "QF",
  "SF",
  "RUNNER_UP",
  "CHAMPION",
];

export function pointsFor(stage: Stage): number {
  return STAGE_POINTS[stage];
}
