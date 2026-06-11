import type { FixtureStage, Stage } from "@prisma/client";

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

// ---------- Live bonus points, computed from fixture results ----------

/**
 * Small additive bonuses on top of stage points, derived entirely from
 * the scores the admin already enters. They keep the leaderboard moving
 * from day one of the group stage without changing what the sweepstake
 * is mostly about (how far your teams go).
 */
export const BONUS_POINTS = {
  groupWin: 2, // win a group-stage match
  groupDraw: 1, // draw a group-stage match
  giantKill: 3, // beat a team ranked GIANT_KILL_GAP+ FIFA places higher
  giantHold: 2, // hold such a team to a draw (group stage only)
  bronze: 5, // win the third-place match
} as const;

/** Minimum FIFA-ranking gap for a win to count as a giant-killing. */
export const GIANT_KILL_GAP = 20;

type BonusFixture = {
  stage: FixtureStage;
  homeScore: number | null;
  awayScore: number | null;
  homeTeam: { id: string; fifaRank: number | null } | null;
  awayTeam: { id: string; fifaRank: number | null } | null;
};

/**
 * Total bonus points per team id across all played fixtures.
 *
 * Knockout matches that finish level (decided on penalties) award no
 * giant-kill/bronze bonus — the recorded score can't tell us the winner,
 * and the survivor's progress is already rewarded via stage points.
 */
export function bonusPointsFromFixtures(
  fixtures: BonusFixture[],
): Record<string, number> {
  const totals: Record<string, number> = {};
  const add = (id: string, pts: number) => {
    totals[id] = (totals[id] ?? 0) + pts;
  };

  for (const f of fixtures) {
    if (
      f.homeScore == null ||
      f.awayScore == null ||
      !f.homeTeam ||
      !f.awayTeam
    ) {
      continue;
    }
    const decisive = f.homeScore !== f.awayScore;
    const winner = f.homeScore > f.awayScore ? f.homeTeam : f.awayTeam;
    const loser = f.homeScore > f.awayScore ? f.awayTeam : f.homeTeam;

    if (f.stage === "GROUP") {
      if (decisive) {
        add(winner.id, BONUS_POINTS.groupWin);
      } else {
        add(f.homeTeam.id, BONUS_POINTS.groupDraw);
        add(f.awayTeam.id, BONUS_POINTS.groupDraw);
        // Giant-held: the underdog held a much stronger team to a draw.
        // Group stage only — a level knockout score means penalties, and
        // the survivor's reward comes via stage points instead.
        if (f.homeTeam.fifaRank != null && f.awayTeam.fifaRank != null) {
          const gap = f.homeTeam.fifaRank - f.awayTeam.fifaRank;
          if (gap >= GIANT_KILL_GAP) add(f.homeTeam.id, BONUS_POINTS.giantHold);
          if (-gap >= GIANT_KILL_GAP) add(f.awayTeam.id, BONUS_POINTS.giantHold);
        }
      }
    }

    if (
      decisive &&
      winner.fifaRank != null &&
      loser.fifaRank != null &&
      winner.fifaRank - loser.fifaRank >= GIANT_KILL_GAP
    ) {
      add(winner.id, BONUS_POINTS.giantKill);
    }

    if (f.stage === "THIRD_PLACE" && decisive) {
      add(winner.id, BONUS_POINTS.bronze);
    }
  }

  return totals;
}
