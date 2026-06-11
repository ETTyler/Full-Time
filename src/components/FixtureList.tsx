import type { Fixture, Team } from "@prisma/client";
import { FIXTURE_STAGE_LABELS, isPlayed } from "@/lib/fixtures";
import { LocalKickoff } from "@/components/LocalKickoff";

export type FixtureWithTeams = Fixture & {
  homeTeam: Team | null;
  awayTeam: Team | null;
};

function Side({
  team,
  label,
  mine,
}: {
  team: Team | null;
  label: string | null;
  mine: boolean;
}) {
  return (
    <span
      className={`inline-flex min-w-0 items-center gap-1.5 ${
        mine ? "font-semibold" : ""
      } ${team ? "" : "text-muted"}`}
    >
      {team ? (
        <>
          <span className="shrink-0">{team.flag}</span>
          <span className="truncate">{team.name}</span>
        </>
      ) : (
        <span className="truncate text-xs">{label ?? "TBD"}</span>
      )}
    </span>
  );
}

function FixtureRow({
  fixture,
  myTeamIds,
}: {
  fixture: FixtureWithTeams;
  myTeamIds: Set<string>;
}) {
  const played = isPlayed(fixture);
  return (
    <li className="flex flex-wrap items-center justify-start gap-x-3 gap-y-1 px-2 py-2.5 text-sm">
      <span className="flex min-w-0 items-center gap-2">
        <Side
          team={fixture.homeTeam}
          label={fixture.homeLabel}
          mine={!!fixture.homeTeamId && myTeamIds.has(fixture.homeTeamId)}
        />
        {played ? (
          <span className="shrink-0 rounded bg-accent/10 px-1.5 py-0.5 font-semibold tabular-nums">
            {fixture.homeScore}–{fixture.awayScore}
          </span>
        ) : (
          <span className="shrink-0 text-xs text-muted">vs</span>
        )}
        <Side
          team={fixture.awayTeam}
          label={fixture.awayLabel}
          mine={!!fixture.awayTeamId && myTeamIds.has(fixture.awayTeamId)}
        />
      </span>
      <span className="flex min-w-0 flex-col text-xs text-muted sm:ml-auto sm:items-end sm:text-right">
        <span>
          {played ? (
            "Full time"
          ) : (
            <LocalKickoff iso={fixture.kickoff.toISOString()} />
          )}
          {fixture.stage !== "GROUP" &&
            ` · ${FIXTURE_STAGE_LABELS[fixture.stage]}`}
        </span>
        <span className="truncate">{fixture.venue}</span>
      </span>
    </li>
  );
}

export function FixtureList({
  fixtures,
  myTeamIds,
}: {
  fixtures: FixtureWithTeams[];
  myTeamIds: Set<string>;
}) {
  const upcoming = fixtures.filter((f) => !isPlayed(f));
  const played = fixtures.filter(isPlayed).reverse(); // most recent first

  if (fixtures.length === 0) {
    return (
      <p className="px-2 py-3 text-sm text-muted">
        No fixtures for your teams yet — knockout match-ups appear here once
        they’re confirmed.
      </p>
    );
  }

  return (
    <div>
      {upcoming.length > 0 ? (
        <ul className="divide-y divide-line">
          {upcoming.map((f) => (
            <FixtureRow key={f.id} fixture={f} myTeamIds={myTeamIds} />
          ))}
        </ul>
      ) : (
        <p className="px-2 py-3 text-sm text-muted">
          No upcoming fixtures for your teams.
        </p>
      )}

      {played.length > 0 && (
        <details className="group border-t border-line">
          <summary className="cursor-pointer list-none px-2 py-2.5 text-xs font-medium text-muted transition-colors hover:text-fg">
            <span className="mr-1 inline-block transition-transform group-open:rotate-90">
              ›
            </span>
            Results ({played.length})
          </summary>
          <ul className="divide-y divide-line opacity-80">
            {played.map((f) => (
              <FixtureRow key={f.id} fixture={f} myTeamIds={myTeamIds} />
            ))}
          </ul>
        </details>
      )}
    </div>
  );
}
