import type { FixtureStage } from "@prisma/client";

/**
 * Knockout bracket helpers. The seeded knockout fixtures encode their own
 * structure in the placeholder labels — e.g. R16 match 89 reads
 * "Winner M74" / "Winner M77", so match 89 is fed by matches 74 and 77.
 * We parse those references to (a) order each round so a bracket laid out
 * in columns aligns each match between its two feeders, and (b) trace a
 * team's onward route to the final.
 */

const WINNER_RE = /Winner M(\d+)/i;

export type BracketStage = "R32" | "R16" | "QF" | "SF" | "FINAL";

const BRACKET_STAGES: BracketStage[] = ["R32", "R16", "QF", "SF", "FINAL"];

export const BRACKET_STAGE_LABELS: Record<BracketStage, string> = {
  R32: "Round of 32",
  R16: "Round of 16",
  QF: "Quarter-finals",
  SF: "Semi-finals",
  FINAL: "Final",
};

type BracketInput = {
  matchNumber: number;
  stage: FixtureStage;
  homeLabel: string | null;
  awayLabel: string | null;
};

function isBracketStage(stage: FixtureStage): stage is BracketStage {
  return (BRACKET_STAGES as string[]).includes(stage);
}

export function buildBracketOrder<T extends BracketInput>(
  fixtures: T[],
): {
  rounds: { stage: BracketStage; label: string; matches: T[] }[];
  /** match number -> the match its winner advances to */
  nextWinner: Record<number, number>;
} {
  const byNumber = new Map<number, T>();
  for (const f of fixtures) byNumber.set(f.matchNumber, f);

  // The two matches that feed a fixture's winners (null for R32 leaves,
  // whose labels point at group placings rather than other matches).
  const winnerFeeders = (f: T): [T | null, T | null] => {
    const parse = (lbl: string | null): T | null => {
      const m = lbl?.match(WINNER_RE);
      return m ? (byNumber.get(Number(m[1])) ?? null) : null;
    };
    return [parse(f.homeLabel), parse(f.awayLabel)];
  };

  const nextWinner: Record<number, number> = {};
  for (const f of fixtures) {
    for (const lbl of [f.homeLabel, f.awayLabel]) {
      const m = lbl?.match(WINNER_RE);
      if (m) nextWinner[Number(m[1])] = f.matchNumber;
    }
  }

  // Depth-first from the final, home subtree before away, recording each
  // match into its round bucket. This yields the correct top-to-bottom
  // order per round for a column-aligned bracket.
  const buckets: Record<BracketStage, T[]> = {
    R32: [],
    R16: [],
    QF: [],
    SF: [],
    FINAL: [],
  };
  const seen = new Set<number>();
  const visit = (f: T | null) => {
    if (!f || seen.has(f.matchNumber)) return;
    seen.add(f.matchNumber);
    const [home, away] = winnerFeeders(f);
    visit(home);
    visit(away);
    if (isBracketStage(f.stage)) buckets[f.stage].push(f);
  };
  visit(fixtures.find((f) => f.stage === "FINAL") ?? null);

  // Safety net: append any bracket match not reached above (data gap) so
  // nothing silently vanishes from the view.
  for (const f of fixtures) {
    if (isBracketStage(f.stage) && !seen.has(f.matchNumber)) {
      buckets[f.stage].push(f);
      seen.add(f.matchNumber);
    }
  }

  const rounds = BRACKET_STAGES.map((stage) => ({
    stage,
    label: BRACKET_STAGE_LABELS[stage],
    matches: buckets[stage],
  })).filter((r) => r.matches.length > 0);

  return { rounds, nextWinner };
}
