import Link from "next/link";
import { redirect } from "next/navigation";
import { auth, signIn } from "@/auth";
import { db } from "@/lib/db";
import { createLeague } from "./actions";
import { SubmitButton } from "@/components/SubmitButton";
import { ScoringExplainer } from "@/components/ScoringExplainer";
import { SectionHeader } from "@/components/SectionHeader";

export default async function Home() {
  const session = await auth();

  if (!session?.user) {
    return (
      <section className="pitch-decor py-24 text-center">
        <div className="relative">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-accent">
            48 teams · 12 groups · one pot
          </p>
          <h1 className="mx-auto mt-4 max-w-xl text-4xl font-semibold leading-tight">
            A World Cup sweepstake for your group chat.
          </h1>
          <p className="mx-auto mt-4 max-w-md text-muted">
            Make a league, share the link, and everyone gets dealt their teams
            at random. The leaderboard does the arguing for you.
          </p>
          <form
            className="mt-8"
            action={async () => {
              "use server";
              await signIn("google");
            }}
          >
            <SubmitButton
              pendingLabel="Heading to Google…"
              className="btn-primary px-5 py-2.5"
            >
              Sign in with Google
            </SubmitButton>
          </form>
        </div>

        <div className="relative mx-auto mt-16 max-w-2xl text-left">
          <h2 className="mb-2 text-center font-semibold">How scoring works</h2>
          <ScoringExplainer />
        </div>
      </section>
    );
  }

  if (!session.user.username) redirect("/onboarding");

  const memberships = await db.membership.findMany({
    where: { userId: session.user.id },
    include: { league: { include: { _count: { select: { members: true } } } } },
    orderBy: { joinedAt: "desc" },
  });

  return (
    <div className="space-y-10">
      <section>
        <SectionHeader label="Your leagues" />
        {memberships.length === 0 ? (
          <p className="text-sm text-muted">
            No leagues yet. Create one below, or ask a friend for their invite
            link.
          </p>
        ) : (
          <ul className="space-y-2">
            {memberships.map(({ league }) => (
              <li key={league.id}>
                <Link
                  href={`/league/${league.inviteCode}`}
                  className="card flex items-center justify-between gap-3 p-4 transition-colors hover:bg-card-2"
                >
                  <span className="min-w-0 truncate text-sm font-medium">
                    {league.name}
                  </span>
                  <span className="flex shrink-0 items-center gap-2 text-xs text-muted">
                    <span className="tabular-nums">
                      {league._count.members}{" "}
                      {league._count.members === 1 ? "member" : "members"}
                    </span>
                    {league.status === "DRAFTED" ? (
                      <span className="rounded border border-gold/30 bg-gold/10 px-1.5 py-0.5 text-[0.62rem] font-medium uppercase tracking-wider text-gold">
                        Drawn
                      </span>
                    ) : (
                      <span className="rounded border border-accent/30 bg-accent/10 px-1.5 py-0.5 text-[0.62rem] font-medium uppercase tracking-wider text-accent">
                        Open
                      </span>
                    )}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section>
        <SectionHeader label="Start a league" />
        <form
          action={async (formData) => {
            "use server";
            await createLeague(formData);
          }}
          className="max-w-md space-y-3"
        >
          <input
            name="name"
            required
            minLength={3}
            maxLength={50}
            placeholder="League name"
            className="input"
          />
          <label className="block">
            <span className="mb-1 block text-xs text-muted">
              Teams per member
            </span>
            <select name="teamsPerPlayer" defaultValue="" className="input">
              <option value="">Biggest equal split</option>
              {[1, 2, 3, 4, 5, 6, 8].map((n) => (
                <option key={n} value={n}>
                  {n} each
                </option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className="mb-1 block text-xs text-muted">Draw style</span>
            <select name="drawMode" defaultValue="LUCKY_DIP" className="input">
              <option value="LUCKY_DIP">
                Lucky dip — pure shuffle, anything goes
              </option>
              <option value="SEEDED">
                Seeded pots — fair spread by FIFA ranking
              </option>
            </select>
          </label>
          <SubmitButton pendingLabel="Creating league…">
            Create league
          </SubmitButton>
        </form>
        <p className="mt-2 text-xs text-muted">
          You’ll get an invite link to share. Once everyone’s in, run the draw
          — every member is dealt the same number of teams, and any leftovers
          stay in the deck.
        </p>
      </section>

      <section>
        <SectionHeader label="How scoring works" />
        <ScoringExplainer />
      </section>
    </div>
  );
}
