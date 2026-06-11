import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { runDraft } from "@/app/actions";
import { Leaderboard } from "@/components/Leaderboard";
import { TeamSticker } from "@/components/TeamSticker";
import { InviteLink } from "@/components/client";
import { LeagueActions } from "@/components/LeagueActions";
import { SubmitButton } from "@/components/SubmitButton";
import { TeamsPerPlayerPicker } from "@/components/TeamsPerPlayerPicker";
import { ScoringExplainer } from "@/components/ScoringExplainer";
import { FixtureList } from "@/components/FixtureList";
import { SectionHeader } from "@/components/SectionHeader";

export default async function LeaguePage({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = await params;
  const session = await auth();
  if (!session?.user) redirect(`/join/${code}`);

  const league = await db.league.findUnique({
    where: { inviteCode: code },
    include: {
      members: { include: { user: true }, orderBy: { joinedAt: "asc" } },
      picks: { include: { team: true, user: true } },
    },
  });

  if (!league) {
    return <p className="py-12 text-center text-muted">League not found.</p>;
  }

  const isMember = league.members.some((m) => m.userId === session.user.id);
  if (!isMember) redirect(`/join/${code}`);

  const isOwner = league.ownerId === session.user.id;
  const myPicks = league.picks
    .filter((p) => p.userId === session.user.id)
    .sort((a, b) => a.team.groupName.localeCompare(b.team.groupName));
  const myTeamIds = myPicks.map((p) => p.teamId);
  const myFixtures =
    league.status === "DRAFTED" && myTeamIds.length > 0
      ? await db.fixture.findMany({
          where: {
            OR: [
              { homeTeamId: { in: myTeamIds } },
              { awayTeamId: { in: myTeamIds } },
            ],
          },
          include: { homeTeam: true, awayTeam: true },
          orderBy: { kickoff: "asc" },
        })
      : [];
  const perPerson =
    league.teamsPerPlayer ?? Math.floor(48 / league.members.length);
  const overSubscribed =
    league.teamsPerPlayer != null &&
    league.teamsPerPlayer * league.members.length > 48;

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">{league.name}</h1>
          <p className="mt-1 text-sm tabular-nums text-muted">
            {league.members.length} members
            {league.status !== "DRAFTED" &&
              (league.teamsPerPlayer != null
                ? ` · ${league.teamsPerPlayer} teams each when drawn`
                : ` · ~${perPerson} teams each when drawn`)}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {league.status === "OPEN" && <InviteLink code={league.inviteCode} />}
          {(isOwner || league.status === "OPEN") && (
            <LeagueActions leagueId={league.id} isOwner={isOwner} />
          )}
        </div>
      </div>

      {league.status === "OPEN" ? (
        <section className="card relative overflow-hidden p-6">
          <div className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-accent via-gold to-accent" />
          <h2 className="text-[0.7rem] font-semibold uppercase tracking-[0.18em] text-muted">
            Waiting for the draw
          </h2>
          <p className="mt-2 text-sm text-muted">
            In so far:{" "}
            {league.members
              .map((m) => m.user.username ?? m.user.name)
              .join(", ")}
            . Share the invite link to get everyone in — the league locks once
            the draw runs.
          </p>
          {isOwner && (
            <div className="mt-5">
              <TeamsPerPlayerPicker
                leagueId={league.id}
                value={league.teamsPerPlayer}
                memberCount={league.members.length}
              />
            </div>
          )}
          {isOwner && (
            <form
              className="mt-4"
              action={async () => {
                "use server";
                await runDraft(league.id);
              }}
            >
              <SubmitButton
                pendingLabel="Drawing teams…"
                disabled={league.members.length < 2 || overSubscribed}
              >
                Run the draw
              </SubmitButton>
              {overSubscribed ? (
                <p className="mt-2 text-xs text-danger">
                  {league.members.length} members ×{" "}
                  {league.teamsPerPlayer} teams each needs more than the 48
                  available.
                </p>
              ) : (
                <p className="mt-2 text-xs text-muted">
                  {league.teamsPerPlayer != null
                    ? `Deals ${league.teamsPerPlayer} random teams to each member. No take-backs.`
                    : "Deals all 48 teams out at random. No take-backs."}
                </p>
              )}
            </form>
          )}
        </section>
      ) : (
        <>
          <section>
            <SectionHeader
              label="Standings"
              hint="select a member to see their teams"
            />
            <div className="card px-2 py-1 sm:px-3">
              <Leaderboard
                picks={league.picks}
                currentUserId={session.user.id}
              />
            </div>
          </section>

          <section>
            <SectionHeader label="Your teams" hint={`${myPicks.length}`} />
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {myPicks.map((p, i) => (
                <div
                  key={p.id}
                  className="fade-up"
                  style={{ animationDelay: `${i * 25}ms` }}
                >
                  <TeamSticker team={p.team} />
                </div>
              ))}
            </div>
          </section>

          <section>
            <SectionHeader
              label="Your fixtures"
              hint="times in your timezone"
            />
            <FixtureList fixtures={myFixtures} myTeamIds={myTeamIds} />
          </section>
        </>
      )}

      <details className="group">
        <summary className="cursor-pointer list-none text-sm font-medium text-muted transition-colors hover:text-fg">
          <span className="mr-1 inline-block transition-transform group-open:rotate-90">
            ›
          </span>
          How scoring works
        </summary>
        <div className="mt-3">
          <ScoringExplainer />
        </div>
      </details>
    </div>
  );
}
