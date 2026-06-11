import { auth, signIn } from "@/auth";
import { db } from "@/lib/db";
import { joinLeague } from "@/app/actions";
import { SubmitButton } from "@/components/SubmitButton";

export default async function JoinPage({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = await params;
  const session = await auth();
  const league = await db.league.findUnique({
    where: { inviteCode: code },
    include: { _count: { select: { members: true } }, owner: true },
  });

  if (!league) {
    return (
      <p className="py-12 text-center text-muted">
        No league found for that invite. Check the link and try again.
      </p>
    );
  }

  return (
    <section className="mx-auto max-w-md py-16">
      <div className="card relative overflow-hidden p-8 text-center">
        <div className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-accent via-gold to-accent" />
        <p className="text-[0.7rem] font-semibold uppercase tracking-[0.18em] text-gold">
          You’re invited
        </p>
        <h1 className="mt-3 text-3xl font-semibold">{league.name}</h1>
        <p className="mt-2 text-sm tabular-nums text-muted">
          {league._count.members} in so far · run by{" "}
          {league.owner.username ?? league.owner.name}
        </p>

        {league.status === "DRAFTED" ? (
          <p className="mt-6 text-sm text-danger">
            This league has already drawn its teams, so it’s closed to new
            members.
          </p>
        ) : session?.user ? (
          <form
            className="mt-8"
            action={async () => {
              "use server";
              await joinLeague(code);
            }}
          >
            <SubmitButton
              pendingLabel="Joining…"
              className="btn-primary px-5 py-2.5"
            >
              Join this league
            </SubmitButton>
          </form>
        ) : (
          <form
            className="mt-8"
            action={async () => {
              "use server";
              await signIn("google", { redirectTo: `/join/${code}` });
            }}
          >
            <SubmitButton
              pendingLabel="Heading to Google…"
              className="btn-primary px-5 py-2.5"
            >
              Sign in with Google to join
            </SubmitButton>
          </form>
        )}
      </div>
    </section>
  );
}
