import type { Fixture, Team } from "@prisma/client";
import { buildBracketOrder } from "@/lib/bracket";
import { isPlayed } from "@/lib/fixtures";

type KnockoutFixture = Fixture & {
  homeTeam: Team | null;
  awayTeam: Team | null;
};

/**
 * Horizontal knockout bracket. The viewer's teams are highlighted, and the
 * prospective route to the final (the matches a still-alive team would play
 * if it keeps winning) is marked with a dashed accent outline.
 */
export function Bracket({
  fixtures,
  myTeams,
}: {
  fixtures: KnockoutFixture[];
  myTeams: Team[];
}) {
  const mine = new Set(myTeams.map((t) => t.id));
  const { rounds, nextWinner } = buildBracketOrder(fixtures);

  // From each alive owned team's furthest knockout match, follow the winner
  // chain forward to the final to mark its potential route.
  const routeMatches = new Set<number>();
  for (const team of myTeams) {
    if (team.eliminated) continue;
    let furthest = -1;
    for (const f of fixtures) {
      if (f.homeTeamId === team.id || f.awayTeamId === team.id) {
        furthest = Math.max(furthest, f.matchNumber);
      }
    }
    if (furthest === -1) continue;
    let cur: number | undefined = nextWinner[furthest];
    while (cur != null) {
      routeMatches.add(cur);
      cur = nextWinner[cur];
    }
  }

  const thirdPlace = fixtures.find((f) => f.stage === "THIRD_PLACE") ?? null;

  if (rounds.length === 0) {
    return (
      <p className="text-sm text-muted">
        The knockout bracket will appear here once the rounds are set up.
      </p>
    );
  }

  return (
    <div className="space-y-4">
      <p className="text-xs text-muted">
        Your teams are highlighted; the dashed outline traces each team’s
        route to the final. Scroll sideways to follow the bracket.
      </p>

      <div className="overflow-x-auto pb-2">
        <div className="flex min-w-max gap-3">
          {rounds.map((round) => (
            <div key={round.stage} className="flex w-40 shrink-0 flex-col">
              <h3 className="mb-2 text-center text-[0.65rem] font-semibold uppercase tracking-[0.18em] text-muted">
                {round.label}
              </h3>
              <div className="flex flex-1 flex-col justify-around gap-3">
                {round.matches.map((f) => (
                  <MatchCard
                    key={f.matchNumber}
                    fixture={f}
                    mine={mine}
                    route={routeMatches.has(f.matchNumber)}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {thirdPlace && (
        <div className="w-40">
          <h3 className="mb-2 text-[0.65rem] font-semibold uppercase tracking-[0.18em] text-muted">
            Third place
          </h3>
          <MatchCard fixture={thirdPlace} mine={mine} route={false} />
        </div>
      )}
    </div>
  );
}

function MatchCard({
  fixture,
  mine,
  route,
}: {
  fixture: KnockoutFixture;
  mine: Set<string>;
  route: boolean;
}) {
  const played = isPlayed(fixture);
  const ownsHome = !!fixture.homeTeamId && mine.has(fixture.homeTeamId);
  const ownsAway = !!fixture.awayTeamId && mine.has(fixture.awayTeamId);
  const owned = ownsHome || ownsAway;
  const homeWin = played && fixture.homeScore! > fixture.awayScore!;
  const awayWin = played && fixture.awayScore! > fixture.homeScore!;

  const border = owned
    ? "border-accent/70"
    : route
      ? "border-dashed border-accent/40"
      : "border-line";

  return (
    <div className={`rounded-lg border ${border} bg-card px-2 py-1.5`}>
      <Side
        team={fixture.homeTeam}
        label={fixture.homeLabel}
        mine={ownsHome}
        win={homeWin}
        score={fixture.homeScore}
        played={played}
      />
      <div className="my-1 h-px bg-line" />
      <Side
        team={fixture.awayTeam}
        label={fixture.awayLabel}
        mine={ownsAway}
        win={awayWin}
        score={fixture.awayScore}
        played={played}
      />
    </div>
  );
}

function Side({
  team,
  label,
  mine,
  win,
  score,
  played,
}: {
  team: Team | null;
  label: string | null;
  mine: boolean;
  win: boolean;
  score: number | null;
  played: boolean;
}) {
  // Dim the losing side once a result is in.
  const dim = played && !win;
  return (
    <div className={`flex items-center gap-1.5 text-xs ${dim ? "opacity-45" : ""}`}>
      <span className="shrink-0">{team ? team.flag : "·"}</span>
      <span
        className={`min-w-0 flex-1 truncate ${
          mine ? "foil-underline font-semibold" : team ? "" : "text-muted"
        }`}
      >
        {team ? team.name : (label ?? "TBD")}
      </span>
      {played && (
        <span className="shrink-0 tabular-nums font-semibold">{score}</span>
      )}
    </div>
  );
}
