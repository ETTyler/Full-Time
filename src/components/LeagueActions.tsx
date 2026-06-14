"use client";

import { useState, useTransition } from "react";
import type { DrawMode } from "@prisma/client";
import { deleteLeague, leaveLeague, redrawLeague } from "@/app/actions";
import { Spinner } from "@/components/Spinner";
import { Modal } from "@/components/Modal";
import { ExitIcon, RefreshIcon, TrashIcon } from "@/components/icons";

type Mode = "redraw" | "remove";

const PER_OPTIONS = [1, 2, 3, 4, 5, 6, 8];

/**
 * Owner/member actions for a league — redraw (owner, after the draw, with
 * the option to change the draw settings), delete (owner) or leave (member).
 * The trigger buttons stay in place; each action confirms in a modal so the
 * surrounding layout never shifts.
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

  // Don't let a backdrop/Escape close interrupt an in-flight request.
  const close = () => {
    if (!pending) reset();
  };

  const doRedraw = () =>
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
    });

  const doRemove = () =>
    startTransition(async () => {
      const result = isOwner
        ? await deleteLeague(leagueId)
        : await leaveLeague(leagueId);
      if (result && "error" in result) setError(result.error);
      else reset();
    });

  const removeLabel = isOwner ? "Delete league" : "Leave league";

  return (
    <>
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

      <Modal open={confirming === "redraw"} onClose={close} title="Redraw teams">
        <p className="text-sm text-muted">
          All teams will be re-dealt to every member. This can’t be undone.
        </p>
        <div className="mt-4 space-y-3">
          <label className="block">
            <span className="mb-1 block text-xs text-muted">Draw style</span>
            <select
              value={nextMode}
              disabled={pending}
              onChange={(e) => setNextMode(e.target.value as DrawMode)}
              className="input py-1.5 text-sm"
            >
              <option value="LUCKY_DIP">Lucky dip</option>
              <option value="SEEDED">Seeded pots</option>
            </select>
          </label>
          <label className="block">
            <span className="mb-1 block text-xs text-muted">
              Teams per member
            </span>
            <select
              value={nextPer ?? ""}
              disabled={pending}
              onChange={(e) =>
                setNextPer(
                  e.target.value === "" ? null : Number(e.target.value),
                )
              }
              className="input py-1.5 text-sm"
            >
              <option value="">Biggest equal split</option>
              {PER_OPTIONS.map((n) => (
                <option key={n} value={n} disabled={n * memberCount > 48}>
                  {n} each
                </option>
              ))}
            </select>
          </label>
        </div>
        {error && <p className="mt-3 text-xs text-danger">{error}</p>}
        <div className="mt-5 flex justify-end gap-2">
          <button
            onClick={reset}
            disabled={pending}
            className="btn-ghost px-3 py-1.5 text-xs"
          >
            Cancel
          </button>
          <button
            onClick={doRedraw}
            disabled={pending}
            className="btn-primary px-3 py-1.5 text-xs"
          >
            {pending ? (
              <>
                <Spinner className="h-3 w-3" />
                Redrawing…
              </>
            ) : (
              "Redraw teams"
            )}
          </button>
        </div>
      </Modal>

      <Modal
        open={confirming === "remove"}
        onClose={close}
        title={isOwner ? "Delete this league?" : "Leave this league?"}
      >
        <p className="text-sm text-muted">
          {isOwner
            ? "This permanently removes the league for everyone. This can’t be undone."
            : "You can rejoin with the invite link while the league is open."}
        </p>
        {error && <p className="mt-3 text-xs text-danger">{error}</p>}
        <div className="mt-5 flex justify-end gap-2">
          <button
            onClick={reset}
            disabled={pending}
            className="btn-ghost px-3 py-1.5 text-xs"
          >
            Cancel
          </button>
          <button
            onClick={doRemove}
            disabled={pending}
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
        </div>
      </Modal>
    </>
  );
}
