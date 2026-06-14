import type { Metadata } from "next";
import { db } from "@/lib/db";
import { Leaderboard } from "@/components/Leaderboard";
import { ScoringExplainer } from "@/components/ScoringExplainer";
import { SectionHeader } from "@/components/SectionHeader";
import {
  bonusPointsFromFixtures,
  bonusBreakdownFromFixtures,
} from "@/lib/scoring";

// Public, read-only view of a league's standings. No sign-in required —
// anyone with the link can follow along, but nothing can be changed here
// and there's no per-viewer "your teams" section.

export async function generateMetadata({
  params,
}: {
  params: Promise<{ code: string }>;
}): Promise<Metadata> {
  const { code } = await params;
  const league = await db.league.findUnique({
    where: { inviteCode: code },
    select: { name: true },
  });
  return {
    title: league ? `${league.name} · Standings` : "Standings",
    description: league
      ? `Live standings for ${league.name} — a FIFA World Cup sweepstake.`
      : undefined,
  };
}

export default async function StandingsPage({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = await params;

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

  const playedFixtures =
    league.status === "DRAFTED"
      ? await db.fixture.findMany({
          where: { homeScore: { not: null }, awayScore: { not: null } },
          include: { homeTeam: true, awayTeam: true },
        })
      : [];
  const bonusPoints = bonusPointsFromFixtures(playedFixtures);
  const bonusBreakdown = bonusBreakdownFromFixtures(playedFixtures);

  return (
    <div className="space-y-8">
      <div>
        <div className="flex flex-wrap items-center gap-2">
          <h1 className="text-2xl font-semibold">{league.name}</h1>
          <span className="rounded-full border border-line bg-card-2 px-2 py-0.5 text-[0.62rem] font-medium uppercase tracking-wider text-muted">
            Read-only
          </span>
        </div>
        <p className="mt-1 text-sm tabular-nums text-muted">
          {league.members.length} members · standings update as results come in
        </p>
      </div>

      {league.status === "DRAFTED" ? (
        <>
          <section>
            <SectionHeader
              label="Standings"
              hint="select a member to see their teams"
            />
            <div className="card px-2 py-1 sm:px-3">
              <Leaderboard
                picks={league.picks}
                currentUserId=""
                bonusPoints={bonusPoints}
                bonusBreakdown={bonusBreakdown}
              />
            </div>
          </section>

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
        </>
      ) : (
        <section className="card p-6">
          <h2 className="text-[0.7rem] font-semibold uppercase tracking-[0.18em] text-muted">
            Draw not run yet
          </h2>
          <p className="mt-3 text-sm text-muted">
            Teams haven’t been dealt for this league yet. Standings will appear
            here once the draw runs.
          </p>
          <ol className="mt-4 grid grid-cols-1 gap-x-6 gap-y-1 sm:grid-cols-2">
            {league.members.map((m, i) => (
              <li
                key={m.id}
                className="flex min-w-0 items-center gap-2.5 border-b border-line py-1.5 text-sm"
              >
                <span className="w-5 shrink-0 text-right text-xs tabular-nums text-muted">
                  {i + 1}
                </span>
                <span className="min-w-0 truncate">
                  {m.user.username ?? m.user.name}
                </span>
              </li>
            ))}
          </ol>
        </section>
      )}
    </div>
  );
}
