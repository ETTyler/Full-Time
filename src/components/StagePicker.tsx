"use client";

import { useEffect, useState, useTransition } from "react";
import type { TournamentStage } from "@prisma/client";
import { setTournamentStage } from "@/app/actions";
import { Spinner } from "@/components/Spinner";

const OPTIONS: { value: TournamentStage; label: string }[] = [
  { value: "GROUP", label: "Group stage" },
  { value: "KNOCKOUT", label: "Knockouts" },
];

/**
 * Admin control for the global tournament phase. Members see group tables
 * by default during the group stage, and the bracket during knockouts.
 */
export function StagePicker({ value }: { value: TournamentStage }) {
  const [selected, setSelected] = useState<TournamentStage>(value);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [pending, startTransition] = useTransition();

  useEffect(() => setSelected(value), [value]);
  useEffect(() => {
    if (!saved) return;
    const t = setTimeout(() => setSaved(false), 2000);
    return () => clearTimeout(t);
  }, [saved]);

  const save = (next: TournamentStage) => {
    if (next === selected) return;
    setSelected(next);
    setError(null);
    startTransition(async () => {
      const result = await setTournamentStage(next);
      if (result && "error" in result) {
        setError(result.error);
        setSelected(value); // revert
      } else {
        setSaved(true);
      }
    });
  };

  return (
    <div className="card flex flex-wrap items-center gap-3 p-3">
      <div className="min-w-0">
        <p className="text-sm font-medium">Tournament stage</p>
        <p className="text-xs text-muted">
          Sets the default view members see — group tables or the bracket.
        </p>
      </div>
      <div className="ml-auto flex items-center gap-2">
        <div className="flex overflow-hidden rounded-lg border border-line">
          {OPTIONS.map((o) => (
            <button
              key={o.value}
              type="button"
              disabled={pending}
              onClick={() => save(o.value)}
              aria-pressed={selected === o.value}
              className={`px-3 py-1.5 text-xs font-medium transition-colors ${
                selected === o.value
                  ? "bg-accent text-[#06130c]"
                  : "text-muted hover:text-fg"
              }`}
            >
              {o.label}
            </button>
          ))}
        </div>
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
      </div>
      {error && <p className="w-full text-xs text-danger">{error}</p>}
    </div>
  );
}
