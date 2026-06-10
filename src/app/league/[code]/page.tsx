import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { runDraft } from "@/app/actions";
import { Leaderboard } from "@/components/Leaderboard";
import { TeamSticker } from "@/components/TeamSticker";
import { InviteLink } from "@/components/client";
import { LeagueActions } from "@/components/LeagueActions";

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
          <p className="mt-1 text-sm text-muted">
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
        <section className="card p-6">
          <h2 className="font-semibold">Waiting for the draw</h2>
          <p className="mt-2 text-sm text-muted">
            In so far:{" "}
            {league.members
              .map((m) => m.user.username ?? m.user.name)
              .join(", ")}
            . Share the invite link to get everyone in — the league locks once
            the draw runs.
          </p>
          {isOwner && (
            <form
              className="mt-5"
              action={async () => {
                "use server";
                await runDraft(league.id);
              }}
            >
              <button
                className="btn-primary px-4 py-2"
                disabled={league.members.length < 2 || overSubscribed}
              >
                Run the draw
              </button>
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
            <div className="mb-2 flex items-baseline justify-between">
              <h2 className="font-semibold">Standings</h2>
              <span className="text-xs text-muted">
                Select a member to see their teams
              </span>
            </div>
            <div className="card px-2 py-1 sm:px-3">
              <Leaderboard
                picks={league.picks}
                currentUserId={session.user.id}
              />
            </div>
          </section>

          <section>
            <h2 className="mb-2 font-semibold">
              Your teams{" "}
              <span className="text-sm font-normal text-muted">
                {myPicks.length}
              </span>
            </h2>
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
        </>
      )}
    </div>
  );
}
