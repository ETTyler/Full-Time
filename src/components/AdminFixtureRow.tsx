"use client";

import { useActionState, useEffect, useState } from "react";
import type { Team } from "@prisma/client";
import { updateFixture } from "@/app/actions";
import type { FixtureWithTeams } from "@/components/FixtureList";
import { Spinner } from "@/components/Spinner";

// datetime-local wants "YYYY-MM-DDTHH:mm" — we store/display UTC.
function toInputValue(d: Date) {
  return d.toISOString().slice(0, 16);
}

export function AdminFixtureRow({
  fixture,
  teams,
}: {
  fixture: FixtureWithTeams;
  teams: Team[];
}) {
  const [state, formAction, pending] = useActionState(updateFixture, null);
  const [justSaved, setJustSaved] = useState(false);

  // Controlled fields — React 19 resets uncontrolled inputs after a form
  // action completes (same pattern as AdminTeamRow).
  const [homeTeamId, setHomeTeamId] = useState(fixture.homeTeamId ?? "");
  const [awayTeamId, setAwayTeamId] = useState(fixture.awayTeamId ?? "");
  const [kickoff, setKickoff] = useState(toInputValue(fixture.kickoff));
  const [venue, setVenue] = useState(fixture.venue);
  const [homeScore, setHomeScore] = useState(
    fixture.homeScore?.toString() ?? "",
  );
  const [awayScore, setAwayScore] = useState(
    fixture.awayScore?.toString() ?? "",
  );

  // Adopt fresh server data (e.g. someone else saved).
  useEffect(() => {
    setHomeTeamId(fixture.homeTeamId ?? "");
    setAwayTeamId(fixture.awayTeamId ?? "");
    setKickoff(toInputValue(fixture.kickoff));
    setVenue(fixture.venue);
    setHomeScore(fixture.homeScore?.toString() ?? "");
    setAwayScore(fixture.awayScore?.toString() ?? "");
  }, [fixture]);

  useEffect(() => {
    if (state && "ok" in state) {
      setJustSaved(true);
      const t = setTimeout(() => setJustSaved(false), 2000);
      return () => clearTimeout(t);
    }
  }, [state]);

  const teamSelect = (
    name: string,
    value: string,
    onChange: (v: string) => void,
    placeholder: string | null,
  ) => (
    <select
      name={name}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      disabled={pending}
      className="input w-40 py-1"
    >
      <option value="">{placeholder ?? "TBD"}</option>
      {teams
        // Hide eliminated teams, but keep the one already picked here so the
        // current selection still shows (e.g. the loser of a played tie).
        .filter((t) => !t.eliminated || t.id === value)
        .map((t) => (
          <option key={t.id} value={t.id}>
            {t.flag} {t.name}
          </option>
        ))}
    </select>
  );

  return (
    <form
      action={formAction}
      className={`flex flex-wrap items-center gap-2 rounded-lg px-2 py-2.5 text-sm transition-colors ${
        justSaved ? "bg-accent/10" : ""
      }`}
    >
      <input type="hidden" name="fixtureId" value={fixture.id} />
      <span className="w-10 shrink-0 text-xs text-muted">
        M{fixture.matchNumber}
      </span>

      {teamSelect("homeTeamId", homeTeamId, setHomeTeamId, fixture.homeLabel)}
      <input
        name="homeScore"
        value={homeScore}
        onChange={(e) => setHomeScore(e.target.value)}
        disabled={pending}
        inputMode="numeric"
        placeholder="–"
        className="input w-12 py-1 text-center"
        aria-label="Home score"
      />
      <span className="text-xs text-muted">v</span>
      <input
        name="awayScore"
        value={awayScore}
        onChange={(e) => setAwayScore(e.target.value)}
        disabled={pending}
        inputMode="numeric"
        placeholder="–"
        className="input w-12 py-1 text-center"
        aria-label="Away score"
      />
      {teamSelect("awayTeamId", awayTeamId, setAwayTeamId, fixture.awayLabel)}

      <input
        type="datetime-local"
        name="kickoff"
        value={kickoff}
        onChange={(e) => setKickoff(e.target.value)}
        disabled={pending}
        className="input w-auto py-1"
        title="Kickoff (UTC)"
      />
      <input
        name="venue"
        value={venue}
        onChange={(e) => setVenue(e.target.value)}
        disabled={pending}
        className="input w-44 py-1"
        aria-label="Venue"
      />

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
