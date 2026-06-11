import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { setUsername } from "../actions";
import { SubmitButton } from "@/components/SubmitButton";

export default async function Onboarding() {
  const session = await auth();
  if (!session?.user) redirect("/");
  if (session.user.username) redirect("/");

  return (
    <section className="mx-auto max-w-md py-12">
      <p className="text-[0.7rem] font-semibold uppercase tracking-[0.18em] text-accent">
        Before kick-off
      </p>
      <h1 className="mt-2 text-2xl font-semibold">Pick a display name</h1>
      <p className="mt-2 text-sm text-muted">
        This is what everyone sees on the leaderboard for the whole tournament.
      </p>
      <form
        action={async (formData) => {
          "use server";
          await setUsername(formData);
        }}
        className="mt-6 space-y-3"
      >
        <input
          name="username"
          required
          pattern="[a-zA-Z0-9_]{3,24}"
          placeholder="username"
          className="input"
          autoFocus
        />
        <SubmitButton pendingLabel="Saving…">Continue</SubmitButton>
        <p className="text-xs text-muted">
          3–24 characters. Letters, numbers and underscores.
        </p>
      </form>
    </section>
  );
}
