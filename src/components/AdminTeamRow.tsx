"use client";

import { useActionState, useEffect, useState } from "react";
import type { Stage, Team } from "@prisma/client";
import { updateTeamProgress } from "@/app/actions";
import { STAGE_LABELS, STAGE_ORDER, pointsFor } from "@/lib/scoring";
import { Spinner } from "@/components/Spinner";

export function AdminTeamRow({ team }: { team: Team }) {
  const [state, formAction, pending] = useActionState(
    updateTeamProgress,
    null,
  );
  const [justSaved, setJustSaved] = useState(false);

  // Controlled fields — React 19 resets uncontrolled form fields after a
  // form action completes, which made the dropdown snap back to its old
  // value. Controlled state survives the reset and the revalidation.
  const [stage, setStage] = useState<Stage>(team.stage);
  const [eliminated, setEliminated] = useState(team.eliminated);

  // If fresh server data arrives (e.g. someone else saved), adopt it.
  useEffect(() => {
    setStage(team.stage);
    setEliminated(team.eliminated);
  }, [team.stage, team.eliminated]);

  // Flash "Saved" for a moment after each successful save.
  useEffect(() => {
    if (state && "ok" in state) {
      setJustSaved(true);
      const t = setTimeout(() => setJustSaved(false), 2000);
      return () => clearTimeout(t);
    }
  }, [state]);

  return (
    <form
      action={formAction}
      className={`flex flex-wrap items-center gap-3 rounded-lg px-2 py-2.5 text-sm transition-colors ${
        justSaved ? "bg-accent/10" : ""
      }`}
    >
      <input type="hidden" name="teamId" value={team.id} />
      <span className="w-52 font-medium">
        {team.flag} {team.name}
        <span className="ml-2 text-xs text-muted">{team.groupName}</span>
      </span>

      <select
        name="stage"
        value={stage}
        onChange={(e) => setStage(e.target.value as Stage)}
        disabled={pending}
        className="input w-auto py-1"
      >
        {STAGE_ORDER.map((s) => (
          <option key={s} value={s}>
            {STAGE_LABELS[s]} ({pointsFor(s)} pts)
          </option>
        ))}
      </select>

      <label className="flex items-center gap-1.5 text-muted">
        <input
          type="checkbox"
          name="eliminated"
          checked={eliminated}
          onChange={(e) => setEliminated(e.target.checked)}
          disabled={pending}
        />
        Eliminated
      </label>

      <button
        disabled={pending}
        className={`btn-ghost min-w-[4.5rem] px-3 py-1 ${
          justSaved ? "border-accent/40 text-accent" : ""
        }`}
      >
        {pending ? (
          <>
            <Spinner className="h-3 w-3" />
            Saving…
          </>
        ) : justSaved ? (
          "Saved ✓"
        ) : (
          "Save"
        )}
      </button>

      {state && "error" in state && (
        <span className="text-xs text-danger">{state.error}</span>
      )}
    </form>
  );
}
