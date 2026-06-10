"use client";

import { useEffect, useState, useTransition } from "react";
import { updateTeamsPerPlayer } from "@/app/actions";

const OPTIONS = [1, 2, 3, 4, 5, 6, 8];

/**
 * Owner-only control on the league page: change how many teams each
 * member is dealt, any time before the draw. Saves on change.
 */
export function TeamsPerPlayerPicker({
  leagueId,
  value,
  memberCount,
}: {
  leagueId: string;
  value: number | null;
  memberCount: number;
}) {
  const [selected, setSelected] = useState(value);
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

  const save = (next: number | null) => {
    setSelected(next);
    setError(null);
    startTransition(async () => {
      const result = await updateTeamsPerPlayer(leagueId, next);
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
        <span className="mb-1 block text-xs text-muted">
          Teams per member
        </span>
        <span className="flex items-center gap-2">
          <select
            value={selected ?? ""}
            disabled={pending}
            onChange={(e) =>
              save(e.target.value === "" ? null : Number(e.target.value))
            }
            className="input w-auto py-1.5"
          >
            <option value="">Split all 48 evenly</option>
            {OPTIONS.map((n) => (
              <option key={n} value={n} disabled={n * memberCount > 48}>
                {n} each ({n * memberCount} of 48 teams)
              </option>
            ))}
          </select>
          <span className="text-xs text-muted" aria-live="polite">
            {pending ? "Saving…" : saved ? "Saved ✓" : ""}
          </span>
        </span>
      </label>
      {error && <p className="mt-1 text-xs text-danger">{error}</p>}
    </div>
  );
}
