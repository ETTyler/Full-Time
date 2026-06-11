import type { FixtureStage } from "@prisma/client";

export const FIXTURE_STAGE_LABELS: Record<FixtureStage, string> = {
  GROUP: "Group stage",
  R32: "Round of 32",
  R16: "Round of 16",
  QF: "Quarter-final",
  SF: "Semi-final",
  THIRD_PLACE: "Third place",
  FINAL: "Final",
};

export const FIXTURE_STAGE_ORDER: FixtureStage[] = [
  "GROUP",
  "R32",
  "R16",
  "QF",
  "SF",
  "THIRD_PLACE",
  "FINAL",
];

/** A fixture counts as played once both scores are in. */
export function isPlayed(f: { homeScore: number | null; awayScore: number | null }) {
  return f.homeScore != null && f.awayScore != null;
}
