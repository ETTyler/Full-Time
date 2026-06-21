import type { FixtureStage, Team } from "@prisma/client";

/**
 * Real-world group standings, computed from the same fixture scores the
 * admin already enters. Pure and server-friendly — like the scoring lib,
 * the UI just renders whatever this returns.
 *
 * 2026 format: 12 groups of 4. Top two of each group qualify directly for
 * the Round of 32; the 8 best third-placed teams join them. So 1st/2nd are
 * "safe" and 3rd is "in contention" — the UI marks them differently.
 */

export type GroupRow = {
  team: Team;
  played: number;
  won: number;
  drawn: number;
  lost: number;
  gf: number; // goals for
  ga: number; // goals against
  gd: number; // goal difference
  points: number; // 3 win / 1 draw
};

export type GroupTable = {
  name: string; // "A".."L"
  rows: GroupRow[]; // sorted best-first
};

type ResultFixture = {
  stage: FixtureStage;
  homeTeamId: string | null;
  awayTeamId: string | null;
  homeScore: number | null;
  awayScore: number | null;
};

function emptyRow(team: Team): GroupRow {
  return {
    team,
    played: 0,
    won: 0,
    drawn: 0,
    lost: 0,
    gf: 0,
    ga: 0,
    gd: 0,
    points: 0,
  };
}

function applyResult(row: GroupRow, scored: number, conceded: number) {
  row.played += 1;
  row.gf += scored;
  row.ga += conceded;
  row.gd = row.gf - row.ga;
  if (scored > conceded) {
    row.won += 1;
    row.points += 3;
  } else if (scored === conceded) {
    row.drawn += 1;
    row.points += 1;
  } else {
    row.lost += 1;
  }
}

/**
 * Build one table per group. `teams` seeds every group with all four sides
 * (so tables render before a ball is kicked); `fixtures` supplies results.
 * Only GROUP-stage fixtures with both teams and both scores count.
 *
 * Tie-break: points, then goal difference, then goals scored, then name.
 * (FIFA's first tie-break is actually head-to-head; this is a close,
 * deterministic approximation that can be refined later.)
 */
export function groupTablesFromFixtures(
  teams: Team[],
  fixtures: ResultFixture[],
): GroupTable[] {
  const rows = new Map<string, GroupRow>();
  for (const team of teams) rows.set(team.id, emptyRow(team));

  for (const f of fixtures) {
    if (
      f.stage !== "GROUP" ||
      f.homeTeamId == null ||
      f.awayTeamId == null ||
      f.homeScore == null ||
      f.awayScore == null
    ) {
      continue;
    }
    const home = rows.get(f.homeTeamId);
    const away = rows.get(f.awayTeamId);
    if (!home || !away) continue;
    applyResult(home, f.homeScore, f.awayScore);
    applyResult(away, f.awayScore, f.homeScore);
  }

  const byGroup = new Map<string, GroupRow[]>();
  for (const row of rows.values()) {
    const g = byGroup.get(row.team.groupName) ?? [];
    g.push(row);
    byGroup.set(row.team.groupName, g);
  }

  return [...byGroup.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([name, groupRows]) => ({
      name,
      rows: groupRows.sort(
        (a, b) =>
          b.points - a.points ||
          b.gd - a.gd ||
          b.gf - a.gf ||
          a.team.name.localeCompare(b.team.name),
      ),
    }));
}
