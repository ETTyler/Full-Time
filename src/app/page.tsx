import Link from "next/link";
import { redirect } from "next/navigation";
import { auth, signIn } from "@/auth";
import { db } from "@/lib/db";
import { createLeague } from "./actions";
import { SubmitButton } from "@/components/SubmitButton";

export default async function Home() {
  const session = await auth();

  if (!session?.user) {
    return (
      <section className="pitch-decor py-24 text-center">
        <div className="relative">
          <p className="text-xs font-medium uppercase tracking-widest text-accent">
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
            <button className="btn-primary px-5 py-2.5">
              Sign in with Google
            </button>
          </form>
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
        <h2 className="font-semibold">Your leagues</h2>
        {memberships.length === 0 ? (
          <p className="mt-3 text-sm text-muted">
            No leagues yet. Create one below, or ask a friend for their invite
            link.
          </p>
        ) : (
          <ul className="mt-3 space-y-2">
            {memberships.map(({ league }) => (
              <li key={league.id}>
                <Link
                  href={`/league/${league.inviteCode}`}
                  className="card flex items-center justify-between p-4 transition-colors hover:bg-card-2"
                >
                  <span className="text-sm font-medium">{league.name}</span>
                  <span className="text-xs text-muted">
                    {league._count.members} members ·{" "}
                    {league.status === "DRAFTED" ? "drawn" : "open"}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section>
        <h2 className="font-semibold">Start a league</h2>
        <form
          action={async (formData) => {
            "use server";
            await createLeague(formData);
          }}
          className="mt-3 max-w-md space-y-3"
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
              <option value="">Split all 48 evenly</option>
              {[1, 2, 3, 4, 5, 6, 8].map((n) => (
                <option key={n} value={n}>
                  {n} each
                </option>
              ))}
            </select>
          </label>
          <SubmitButton pendingLabel="Creating league…">
            Create league
          </SubmitButton>
        </form>
        <p className="mt-2 text-xs text-muted">
          You’ll get an invite link to share. Once everyone’s in, run the draw
          and teams are dealt out at random — any leftovers stay in the deck.
        </p>
      </section>
    </div>
  );
}
