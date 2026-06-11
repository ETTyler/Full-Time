"use client";

import { useEffect, useState, useTransition } from "react";
import type { DrawMode } from "@prisma/client";
import { updateDrawMode } from "@/app/actions";
import { Spinner } from "@/components/Spinner";

export const DRAW_MODE_DESCRIPTIONS: Record<DrawMode, string> = {
  LUCKY_DIP:
    "Pure shuffle — someone can land both Argentina and France.",
  SEEDED:
    "Teams are dealt in FIFA-ranking pots: everyone gets one team from the top seeds, one from the next tier, and so on.",
};

/**
 * Owner-only control on the league page: choose how the draw deals
 * teams, any time before it runs. Saves on change.
 */
export function DrawModePicker({
  leagueId,
  value,
}: {
  leagueId: string;
  value: DrawMode;
}) {
  const [selected, setSelected] = useState<DrawMode>(value);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [pending, startTransition] = useTransition();

  // Adopt fresh server data after revalidation.
  useEffect(() => setSelected(value), [value]);

  useEffect(() => {
    if (!saved) return;
    const t = setTimeout(() => setSaved(false), 2000);
    return () => clearTimeout(t);
  }, [saved]);

  const save = (next: DrawMode) => {
    setSelected(next);
    setError(null);
    startTransition(async () => {
      const result = await updateDrawMode(leagueId, next);
      if (result && "error" in result) {
        setError(result.error);
        setSelected(value); // revert
      } else {
        setSaved(true);
      }
    });
  };

  return (
    <div>
      <label className="block">
        <span className="mb-1 block text-xs text-muted">Draw style</span>
        <span className="flex items-center gap-2">
          <select
            value={selected}
            disabled={pending}
            onChange={(e) => save(e.target.value as DrawMode)}
            className="input w-auto py-1.5"
          >
            <option value="LUCKY_DIP">Lucky dip</option>
            <option value="SEEDED">Seeded pots (fairer)</option>
          </select>
          <span
            className="flex items-center gap-1.5 text-xs text-muted"
            aria-live="polite"
          >
            {pending ? (
              <>
                <Spinner className="h-3 w-3" />
                Saving…
              </>
            ) : saved ? (
              "Saved ✓"
            ) : (
              ""
            )}
          </span>
        </span>
      </label>
      <p className="mt-1 max-w-md text-xs text-muted">
        {DRAW_MODE_DESCRIPTIONS[selected]}
      </p>
      {error && <p className="mt-1 text-xs text-danger">{error}</p>}
    </div>
  );
}
