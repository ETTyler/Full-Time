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
  giantKill: 3, // beat a team ranked GIANT_KILL_GAP+ FIFA places higher (group stage)
  giantKillKo: 5, // same, but in a knockout match — worth more
  giantHold: 2, // hold such a team to a draw (group stage only)
  bronze: 5, // win the third-place match
} as const;

export type BonusKind = keyof typeof BONUS_POINTS;

/** Human-readable name for each bonus, used in the per-team breakdown. */
export const BONUS_LABELS: Record<BonusKind, string> = {
  groupWin: "Group-stage win",
  groupDraw: "Group-stage draw",
  giantKill: "Giant-killing",
  giantKillKo: "Giant-killing (knockout)",
  giantHold: "Giant-held draw",
  bronze: "Third-place win",
};

/** Minimum FIFA-ranking gap for a win to count as a giant-killing. */
export const GIANT_KILL_GAP = 20;

type BonusFixture = {
  stage: FixtureStage;
  homeScore: number | null;
  awayScore: number | null;
  homeTeam: { id: string; fifaRank: number | null } | null;
  awayTeam: { id: string; fifaRank: number | null } | null;
};

/** A single bonus awarded to one team from one fixture. */
type BonusEvent = { teamId: string; kind: BonusKind };

/**
 * Every bonus event across all played fixtures — the single source of
 * truth that both the totals and the per-team breakdown derive from.
 *
 * Knockout matches that finish level (decided on penalties) award no
 * giant-kill/bronze bonus — the recorded score can't tell us the winner,
 * and the survivor's progress is already rewarded via stage points.
 */
/** Bonus events earned in a single fixture (empty if not yet played). */
function bonusEventsForFixture(f: BonusFixture): BonusEvent[] {
  const events: BonusEvent[] = [];
  const add = (teamId: string, kind: BonusKind) => {
    events.push({ teamId, kind });
  };

  if (
    f.homeScore == null ||
    f.awayScore == null ||
    !f.homeTeam ||
    !f.awayTeam
  ) {
    return events;
  }
  const decisive = f.homeScore !== f.awayScore;
  const winner = f.homeScore > f.awayScore ? f.homeTeam : f.awayTeam;
  const loser = f.homeScore > f.awayScore ? f.awayTeam : f.homeTeam;

  if (f.stage === "GROUP") {
    if (decisive) {
      add(winner.id, "groupWin");
    } else {
      add(f.homeTeam.id, "groupDraw");
      add(f.awayTeam.id, "groupDraw");
      // Giant-held: the underdog held a much stronger team to a draw.
      // Group stage only — a level knockout score means penalties, and
      // the survivor's reward comes via stage points instead.
      if (f.homeTeam.fifaRank != null && f.awayTeam.fifaRank != null) {
        const gap = f.homeTeam.fifaRank - f.awayTeam.fifaRank;
        if (gap >= GIANT_KILL_GAP) add(f.homeTeam.id, "giantHold");
        if (-gap >= GIANT_KILL_GAP) add(f.awayTeam.id, "giantHold");
      }
    }
  }

  if (
    decisive &&
    winner.fifaRank != null &&
    loser.fifaRank != null &&
    winner.fifaRank - loser.fifaRank >= GIANT_KILL_GAP
  ) {
    // Knockout giant-killings are worth more than group-stage ones.
    add(winner.id, f.stage === "GROUP" ? "giantKill" : "giantKillKo");
  }

  if (f.stage === "THIRD_PLACE" && decisive) {
    add(winner.id, "bronze");
  }

  return events;
}

function bonusEventsFromFixtures(fixtures: BonusFixture[]): BonusEvent[] {
  return fixtures.flatMap(bonusEventsForFixture);
}

/**
 * Bonus points earned in a single fixture by the given team(s) — used to
 * show points-per-game in the results list. Returns the total and the
 * labels behind it (e.g. ["Group-stage win"]) for a tooltip. Stage points
 * aren't included: they reward the furthest stage reached, not one match.
 */
export function fixtureBonusForTeams(
  fixture: BonusFixture,
  teamIds: Iterable<string>,
): { points: number; labels: string[] } {
  const ids = teamIds instanceof Set ? teamIds : new Set(teamIds);
  let points = 0;
  const labels: string[] = [];
  for (const e of bonusEventsForFixture(fixture)) {
    if (ids.has(e.teamId)) {
      points += BONUS_POINTS[e.kind];
      labels.push(BONUS_LABELS[e.kind]);
    }
  }
  return { points, labels };
}

/**
 * Total bonus points per team id across all played fixtures.
 */
export function bonusPointsFromFixtures(
  fixtures: BonusFixture[],
): Record<string, number> {
  const totals: Record<string, number> = {};
  for (const e of bonusEventsFromFixtures(fixtures)) {
    totals[e.teamId] = (totals[e.teamId] ?? 0) + BONUS_POINTS[e.kind];
  }
  return totals;
}

/** One aggregated line in a team's bonus breakdown. */
export type BonusLine = {
  kind: BonusKind;
  label: string;
  count: number; // how many times this bonus was earned
  points: number; // total points from this bonus (count × per-event value)
};

/**
 * Per-team breakdown of bonus points, aggregated by kind. Lines come back
 * in a stable order (highest total first) so the UI reads consistently.
 */
export function bonusBreakdownFromFixtures(
  fixtures: BonusFixture[],
): Record<string, BonusLine[]> {
  const byTeam: Record<string, Map<BonusKind, BonusLine>> = {};

  for (const e of bonusEventsFromFixtures(fixtures)) {
    const lines = (byTeam[e.teamId] ??= new Map());
    const line = lines.get(e.kind) ?? {
      kind: e.kind,
      label: BONUS_LABELS[e.kind],
      count: 0,
      points: 0,
    };
    line.count += 1;
    line.points += BONUS_POINTS[e.kind];
    lines.set(e.kind, line);
  }

  const result: Record<string, BonusLine[]> = {};
  for (const [teamId, lines] of Object.entries(byTeam)) {
    result[teamId] = [...lines.values()].sort((a, b) => b.points - a.points);
  }
  return result;
}
