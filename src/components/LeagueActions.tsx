"use client";

import { useState, useTransition } from "react";
import { deleteLeague, leaveLeague } from "@/app/actions";

/**
 * Delete (creator) or leave (member) a league, with a two-step
 * inline confirmation instead of a browser dialog.
 */
export function LeagueActions({
  leagueId,
  isOwner,
}: {
  leagueId: string;
  isOwner: boolean;
}) {
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const verb = isOwner ? "Delete league" : "Leave league";

  if (!confirming) {
    return (
      <button
        onClick={() => setConfirming(true)}
        className="btn-ghost px-3 py-1.5 text-xs text-muted hover:text-danger"
      >
        {verb}
      </button>
    );
  }

  return (
    <span className="flex items-center gap-2">
      {error ? (
        <span className="text-xs text-danger">{error}</span>
      ) : (
        <span className="text-xs text-muted">
          {isOwner
            ? "This removes the league for everyone."
            : "You can rejoin with the invite link while it’s open."}
        </span>
      )}
      <button
        disabled={pending}
        onClick={() =>
          startTransition(async () => {
            const result = isOwner
              ? await deleteLeague(leagueId)
              : await leaveLeague(leagueId);
            if (result && "error" in result) setError(result.error);
          })
        }
        className="btn-ghost border-danger/40 px-3 py-1.5 text-xs text-danger"
      >
        {pending ? "Working…" : `Yes, ${isOwner ? "delete" : "leave"}`}
      </button>
      <button
        disabled={pending}
        onClick={() => {
          setConfirming(false);
          setError(null);
        }}
        className="btn-ghost px-3 py-1.5 text-xs"
      >
        Cancel
      </button>
    </span>
  );
}
