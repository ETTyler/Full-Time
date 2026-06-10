import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { setUsername } from "../actions";

export default async function Onboarding() {
  const session = await auth();
  if (!session?.user) redirect("/");
  if (session.user.username) redirect("/");

  return (
    <section className="mx-auto max-w-md py-12">
      <h1 className="text-2xl font-semibold">Pick a display name</h1>
      <p className="mt-2 text-sm text-muted">
        This is what everyone sees on the leaderboard for the whole tournament.
      </p>
      <form action={setUsername} className="mt-6 space-y-3">
        <input
          name="username"
          required
          pattern="[a-zA-Z0-9_]{3,24}"
          placeholder="username"
          className="input"
          autoFocus
        />
        <button className="btn-primary px-4 py-2">Continue</button>
        <p className="text-xs text-muted">
          3–24 characters. Letters, numbers and underscores.
        </p>
      </form>
    </section>
  );
}
