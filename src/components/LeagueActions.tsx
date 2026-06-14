"use client";

import { useState, useTransition } from "react";
import type { DrawMode } from "@prisma/client";
import { deleteLeague, leaveLeague, redrawLeague } from "@/app/actions";
import { Spinner } from "@/components/Spinner";
import { ExitIcon, RefreshIcon, TrashIcon } from "@/components/icons";

type Mode = "redraw" | "remove";

const PER_OPTIONS = [1, 2, 3, 4, 5, 6, 8];

/**
 * Owner/member actions for a league — redraw (owner, after the draw,
 * with the option to change the draw settings), delete (owner) or
 * leave (member) — each behind a two-step inline confirmation.
 */
export function LeagueActions({
  leagueId,
  isOwner,
  canRedraw = false,
  drawMode = "LUCKY_DIP",
  teamsPerPlayer = null,
  memberCount = 2,
}: {
  leagueId: string;
  isOwner: boolean;
  canRedraw?: boolean;
  drawMode?: DrawMode;
  teamsPerPlayer?: number | null;
  memberCount?: number;
}) {
  const [confirming, setConfirming] = useState<Mode | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  // Redraw options — start from the league's current settings.
  const [nextMode, setNextMode] = useState<DrawMode>(drawMode);
  const [nextPer, setNextPer] = useState<number | null>(teamsPerPlayer);

  const reset = () => {
    setConfirming(null);
    setError(null);
    setNextMode(drawMode);
    setNextPer(teamsPerPlayer);
  };

  if (confirming === "redraw") {
    return (
      <span className="flex flex-wrap items-center justify-end gap-2">
        <select
          value={nextMode}
          disabled={pending}
          onChange={(e) => setNextMode(e.target.value as DrawMode)}
          className="input w-auto py-1 text-xs"
          aria-label="Draw style"
        >
          <option value="LUCKY_DIP">Lucky dip</option>
          <option value="SEEDED">Seeded pots</option>
        </select>
        <select
          value={nextPer ?? ""}
          disabled={pending}
          onChange={(e) =>
            setNextPer(e.target.value === "" ? null : Number(e.target.value))
          }
          className="input w-auto py-1 text-xs"
          aria-label="Teams per member"
        >
          <option value="">Biggest equal split</option>
          {PER_OPTIONS.map((n) => (
            <option key={n} value={n} disabled={n * memberCount > 48}>
              {n} each
            </option>
          ))}
        </select>
        {error ? (
          <span className="w-full text-right text-xs text-danger sm:w-auto">
            {error}
          </span>
        ) : (
          <span className="w-full text-right text-xs text-muted sm:w-auto">
            All teams get re-dealt.
          </span>
        )}
        <button
          disabled={pending}
          onClick={() =>
            startTransition(async () => {
              const result = await redrawLeague(leagueId, {
                drawMode: nextMode,
                teamsPerPlayer: nextPer,
              });
              if (result && "error" in result) {
                setError(result.error);
              } else {
                reset();
              }
            })
          }
          className="btn-ghost border-gold/40 px-3 py-1.5 text-xs text-gold"
        >
          {pending ? (
            <>
              <Spinner className="h-3 w-3" />
              Redrawing…
            </>
          ) : (
            "Yes, redraw"
          )}
        </button>
        <button
          disabled={pending}
          onClick={reset}
          className="btn-ghost px-3 py-1.5 text-xs"
        >
          Cancel
        </button>
      </span>
    );
  }

  if (confirming === "remove") {
    return (
      <span className="flex flex-wrap items-center gap-2">
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
          {pending ? (
            <>
              <Spinner className="h-3 w-3" />
              Working…
            </>
          ) : (
            `Yes, ${isOwner ? "delete" : "leave"}`
          )}
        </button>
        <button
          disabled={pending}
          onClick={reset}
          className="btn-ghost px-3 py-1.5 text-xs"
        >
          Cancel
        </button>
      </span>
    );
  }

  const removeLabel = isOwner ? "Delete league" : "Leave league";

  return (
    <span className="flex items-center gap-2">
      {canRedraw && (
        <button
          onClick={() => setConfirming("redraw")}
          aria-label="Redraw teams"
          title="Redraw teams"
          className="btn-ghost inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs text-muted hover:text-gold sm:px-3"
        >
          <RefreshIcon className="h-4 w-4" />
          <span className="hidden sm:inline">Redraw teams</span>
        </button>
      )}
      <button
        onClick={() => setConfirming("remove")}
        aria-label={removeLabel}
        title={removeLabel}
        className="btn-ghost inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs text-muted hover:text-danger sm:px-3"
      >
        {isOwner ? (
          <TrashIcon className="h-4 w-4" />
        ) : (
          <ExitIcon className="h-4 w-4" />
        )}
        <span className="hidden sm:inline">{removeLabel}</span>
      </button>
    </span>
  );
}
