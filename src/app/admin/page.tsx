import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { isAdmin } from "@/lib/admin";
import { AdminTeamRow } from "@/components/AdminTeamRow";
import { AdminFixtureRow } from "@/components/AdminFixtureRow";
import { AdminTabs } from "@/components/AdminTabs";
import { FIXTURE_STAGE_LABELS, FIXTURE_STAGE_ORDER } from "@/lib/fixtures";

export default async function AdminPage() {
  const session = await auth();
  if (!isAdmin(session?.user?.email)) redirect("/");

  const [teams, fixtures] = await Promise.all([
    db.team.findMany({
      orderBy: [{ groupName: "asc" }, { name: "asc" }],
    }),
    db.fixture.findMany({
      include: { homeTeam: true, awayTeam: true },
      orderBy: { kickoff: "asc" },
    }),
  ]);

  const byStage = FIXTURE_STAGE_ORDER.map((stage) => ({
    stage,
    fixtures: fixtures.filter((f) => f.stage === stage),
  })).filter((s) => s.fixtures.length > 0);

  const teamsTab = (
    <section>
      <p className="text-sm text-muted">
        Set the furthest stage each team has reached, and mark them eliminated
        once they’re out. Every leaderboard updates instantly.
      </p>
      <div className="mt-4 divide-y divide-line">
        {teams.map((team) => (
          <AdminTeamRow key={team.id} team={team} />
        ))}
      </div>
    </section>
  );

  const fixturesTab = (
    <section>
      <p className="text-sm text-muted">
        Knockout match-ups start as placeholders — pick the teams once each
        tie is confirmed, and enter scores after full time. Kickoff times are
        in UTC.
      </p>
      <div className="mt-4 space-y-3">
        {byStage.map(({ stage, fixtures: stageFixtures }) => (
          <details
            key={stage}
            className="group card px-3 py-2"
            open={stage !== "GROUP"}
          >
            <summary className="cursor-pointer list-none py-1 text-sm font-semibold">
              <span className="mr-1 inline-block transition-transform group-open:rotate-90">
                ›
              </span>
              {FIXTURE_STAGE_LABELS[stage]}{" "}
              <span className="font-normal text-muted">
                {stageFixtures.length}{" "}
                {stageFixtures.length === 1 ? "match" : "matches"}
              </span>
            </summary>
            <div className="divide-y divide-line">
              {stageFixtures.map((fixture) => (
                <AdminFixtureRow
                  key={fixture.id}
                  fixture={fixture}
                  teams={teams}
                />
              ))}
            </div>
          </details>
        ))}
        {byStage.length === 0 && (
          <p className="text-sm text-muted">
            No fixtures in the database yet — run{" "}
            <code className="rounded bg-line/40 px-1">npm run db:seed</code>{" "}
            to load the full match schedule.
          </p>
        )}
      </div>
    </section>
  );

  return (
    <div>
      <h1 className="text-2xl font-semibold">Tournament control</h1>
      <div className="mt-4">
        <AdminTabs
          tabs={[
            { label: "Teams", content: teamsTab },
            { label: "Fixtures", content: fixturesTab },
          ]}
        />
      </div>
    </div>
  );
}
