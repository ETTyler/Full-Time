"use client";

import { useState, useTransition } from "react";
import { deleteLeague, leaveLeague, redrawLeague } from "@/app/actions";

type Mode = "redraw" | "remove";

/**
 * Owner/member actions for a league — redraw (owner, after the draw),
 * delete (owner) or leave (member) — each behind a two-step inline
 * confirmation instead of a browser dialog.
 */
export function LeagueActions({
  leagueId,
  isOwner,
  canRedraw = false,
}: {
  leagueId: string;
  isOwner: boolean;
  canRedraw?: boolean;
}) {
  const [confirming, setConfirming] = useState<Mode | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  if (confirming) {
    const isRedraw = confirming === "redraw";
    return (
      <span className="flex flex-wrap items-center gap-2">
        {error ? (
          <span className="text-xs text-danger">{error}</span>
        ) : (
          <span className="text-xs text-muted">
            {isRedraw
              ? "All teams go back in the deck and get re-dealt."
              : isOwner
                ? "This removes the league for everyone."
                : "You can rejoin with the invite link while it’s open."}
          </span>
        )}
        <button
          disabled={pending}
          onClick={() =>
            startTransition(async () => {
              const result = isRedraw
                ? await redrawLeague(leagueId)
                : isOwner
                  ? await deleteLeague(leagueId)
                  : await leaveLeague(leagueId);
              if (result && "error" in result) {
                setError(result.error);
              } else {
                setConfirming(null);
                setError(null);
              }
            })
          }
          className={`btn-ghost px-3 py-1.5 text-xs ${
            isRedraw
              ? "border-gold/40 text-gold"
              : "border-danger/40 text-danger"
          }`}
        >
          {pending
            ? "Working…"
            : isRedraw
              ? "Yes, redraw"
              : `Yes, ${isOwner ? "delete" : "leave"}`}
        </button>
        <button
          disabled={pending}
          onClick={() => {
            setConfirming(null);
            setError(null);
          }}
          className="btn-ghost px-3 py-1.5 text-xs"
        >
          Cancel
        </button>
      </span>
    );
  }

  return (
    <span className="flex items-center gap-2">
      {canRedraw && (
        <button
          onClick={() => setConfirming("redraw")}
          className="btn-ghost px-3 py-1.5 text-xs text-muted hover:text-gold"
        >
          Redraw teams
        </button>
      )}
      <button
        onClick={() => setConfirming("remove")}
        className="btn-ghost px-3 py-1.5 text-xs text-muted hover:text-danger"
      >
        {isOwner ? "Delete league" : "Leave league"}
      </button>
    </span>
  );
}
