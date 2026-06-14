"use client";

import { useEffect, useState } from "react";
import type { Fixture, Team } from "@prisma/client";
import { FIXTURE_STAGE_LABELS, isPlayed } from "@/lib/fixtures";
import { fixtureBonusForTeams } from "@/lib/scoring";

export type FixtureWithTeams = Fixture & {
  homeTeam: Team | null;
  awayTeam: Team | null;
};

// ---------- deterministic date helpers ----------
// First paint (server + hydration) uses hand-built UTC strings so both
// sides render identically; after mount everything re-renders in the
// viewer's local timezone.

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTHS = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];
const pad = (n: number) => String(n).padStart(2, "0");

function dayInfo(d: Date, mounted: boolean) {
  if (!mounted) {
    return {
      key: d.toISOString().slice(0, 10),
      label: `${DAYS[d.getUTCDay()]} ${d.getUTCDate()} ${MONTHS[d.getUTCMonth()]}`,
    };
  }
  return {
    key: d.toLocaleDateString("en-CA"), // YYYY-MM-DD in local tz
    label: d.toLocaleDateString(undefined, {
      weekday: "short",
      day: "numeric",
      month: "short",
    }),
  };
}

function LocalTime({ iso }: { iso: string }) {
  const [label, setLabel] = useState(() => {
    const d = new Date(iso);
    return `${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())}`;
  });
  useEffect(() => {
    setLabel(
      new Date(iso).toLocaleTimeString(undefined, {
        hour: "2-digit",
        minute: "2-digit",
      }),
    );
  }, [iso]);
  return (
    <time dateTime={iso} className="tabular-nums">
      {label}
    </time>
  );
}

function LocalDateTime({ iso }: { iso: string }) {
  const [label, setLabel] = useState(() => {
    const d = new Date(iso);
    return `${DAYS[d.getUTCDay()]} ${d.getUTCDate()} ${
      MONTHS[d.getUTCMonth()]
    }, ${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())}`;
  });
  useEffect(() => {
    setLabel(
      new Date(iso).toLocaleString(undefined, {
        weekday: "short",
        day: "numeric",
        month: "short",
        hour: "2-digit",
        minute: "2-digit",
      }),
    );
  }, [iso]);
  return <time dateTime={iso}>{label}</time>;
}

/** "Kicks off in 3h 12m" — client-only, ticks every minute. */
function Countdown({ iso }: { iso: string }) {
  const [now, setNow] = useState<number | null>(null);
  useEffect(() => {
    setNow(Date.now());
    const t = setInterval(() => setNow(Date.now()), 60_000);
    return () => clearInterval(t);
  }, []);

  if (now == null) return null;
  const diff = new Date(iso).getTime() - now;
  if (diff > 48 * 3_600_000) return null;

  const chip =
    "rounded-full border border-gold/30 bg-gold/10 px-2.5 py-0.5 text-xs font-medium text-gold";
  if (diff <= 0) return <span className={chip}>In play</span>;
  const h = Math.floor(diff / 3_600_000);
  const m = Math.floor((diff % 3_600_000) / 60_000);
  return (
    <span className={chip}>
      Kicks off in {h > 0 ? `${h}h ` : ""}
      {m}m
    </span>
  );
}

// ---------- presentation helpers ----------

function venueCity(venue: string) {
  if (venue.startsWith("BC Place")) return "Vancouver";
  return venue
    .replace("New York/New Jersey", "New York/NJ")
    .replace("San Francisco Bay Area", "SF Bay Area")
    .replace(/\s*Stadium\s*$/, "");
}

type Outcome = "W" | "D" | "L" | null;

function outcomeFor(f: FixtureWithTeams, mine: Set<string>): Outcome {
  if (!isPlayed(f)) return null;
  const homeMine = !!f.homeTeamId && mine.has(f.homeTeamId);
  const awayMine = !!f.awayTeamId && mine.has(f.awayTeamId);
  if (homeMine === awayMine) {
    // both teams yours (derby!) or neither — only a draw reads cleanly
    return f.homeScore === f.awayScore ? "D" : null;
  }
  const my = homeMine ? f.homeScore! : f.awayScore!;
  const opp = homeMine ? f.awayScore! : f.homeScore!;
  return my > opp ? "W" : my < opp ? "L" : "D";
}

const OUTCOME_TINT: Record<Exclude<Outcome, null>, string> = {
  W: "bg-accent/[0.05]",
  D: "",
  L: "bg-danger/[0.05]",
};
const OUTCOME_CHIP: Record<Exclude<Outcome, null>, string> = {
  W: "border-accent/30 text-accent",
  D: "border-line text-muted",
  L: "border-danger/30 text-danger",
};

function Side({
  team,
  label,
  mine,
}: {
  team: Team | null;
  label: string | null;
  mine: boolean;
}) {
  return (
    <span
      className={`inline-flex min-w-0 items-center gap-1.5 ${
        team ? "" : "text-muted"
      }`}
    >
      {team ? (
        <>
          <span className="shrink-0">{team.flag}</span>
          <span
            className={`truncate ${mine ? "foil-underline font-semibold" : ""}`}
          >
            {team.name}
          </span>
        </>
      ) : (
        <span className="truncate text-xs">{label ?? "TBD"}</span>
      )}
    </span>
  );
}

function StageChip({ fixture }: { fixture: FixtureWithTeams }) {
  if (fixture.stage === "GROUP") return null;
  return (
    <span className="shrink-0 rounded border border-line bg-card-2 px-1.5 py-0.5 text-[0.62rem] font-medium uppercase tracking-wider text-muted">
      {FIXTURE_STAGE_LABELS[fixture.stage]}
    </span>
  );
}

// ---------- rows ----------

function FixtureRow({
  fixture,
  myTeamIds,
}: {
  fixture: FixtureWithTeams;
  myTeamIds: Set<string>;
}) {
  const played = isPlayed(fixture);
  const outcome = outcomeFor(fixture, myTeamIds);
  const bonus = played
    ? fixtureBonusForTeams(fixture, myTeamIds)
    : { points: 0, labels: [] };

  return (
    <li
      className={`flex flex-col gap-y-1.5 rounded-lg px-2 py-2.5 text-sm sm:flex-row sm:items-center sm:gap-x-3 ${
        outcome ? OUTCOME_TINT[outcome] : ""
      }`}
    >
      <span className="flex min-w-0 items-center gap-2">
        <span className="w-11 shrink-0 text-xs text-muted">
          <LocalTime iso={fixture.kickoff.toISOString()} />
        </span>
        <Side
          team={fixture.homeTeam}
          label={fixture.homeLabel}
          mine={!!fixture.homeTeamId && myTeamIds.has(fixture.homeTeamId)}
        />
        {played ? (
          <span className="shrink-0 rounded bg-gold/10 px-1.5 py-0.5 font-semibold tabular-nums text-gold">
            {fixture.homeScore}–{fixture.awayScore}
          </span>
        ) : (
          <span className="shrink-0 text-xs text-muted">v</span>
        )}
        <Side
          team={fixture.awayTeam}
          label={fixture.awayLabel}
          mine={!!fixture.awayTeamId && myTeamIds.has(fixture.awayTeamId)}
        />
      </span>

      <span className="flex items-center gap-2 pl-[3.25rem] sm:ml-auto sm:pl-0">
        {outcome && (
          <span
            className={`inline-flex h-4.5 w-4.5 shrink-0 items-center justify-center rounded-full border text-[0.62rem] font-bold ${OUTCOME_CHIP[outcome]}`}
          >
            {outcome}
          </span>
        )}
        {bonus.points > 0 && (
          <span
            title={`Points this game: ${bonus.labels.join(", ")}`}
            className="shrink-0 rounded bg-gold/10 px-1.5 py-0.5 text-[0.62rem] font-semibold tabular-nums text-gold"
          >
            +{bonus.points}
          </span>
        )}
        <StageChip fixture={fixture} />
        <span className="truncate text-xs text-muted">
          {venueCity(fixture.venue)}
        </span>
      </span>
    </li>
  );
}

function DayHeader({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-3 px-1 pb-1 pt-4 first:pt-2">
      <span className="text-[0.65rem] font-semibold uppercase tracking-[0.18em] text-muted">
        {label}
      </span>
      <span className="h-px flex-1 bg-line" />
    </div>
  );
}

function DayGroups({
  fixtures,
  myTeamIds,
  mounted,
}: {
  fixtures: FixtureWithTeams[];
  myTeamIds: Set<string>;
  mounted: boolean;
}) {
  const groups: { key: string; label: string; items: FixtureWithTeams[] }[] =
    [];
  for (const f of fixtures) {
    const { key, label } = dayInfo(f.kickoff, mounted);
    const last = groups[groups.length - 1];
    if (last && last.key === key) last.items.push(f);
    else groups.push({ key, label, items: [f] });
  }

  return (
    <>
      {groups.map((g) => (
        <div key={g.key}>
          <DayHeader label={g.label} />
          <ul>
            {g.items.map((f) => (
              <FixtureRow key={f.id} fixture={f} myTeamIds={myTeamIds} />
            ))}
          </ul>
        </div>
      ))}
    </>
  );
}

// ---------- next-match hero ----------

function HeroSide({
  team,
  label,
  mine,
}: {
  team: Team | null;
  label: string | null;
  mine: boolean;
}) {
  return (
    <span className="flex min-w-0 flex-1 flex-col items-center gap-1.5">
      <span className="text-3xl leading-none">{team ? team.flag : "·"}</span>
      <span
        className={`max-w-full truncate text-sm ${
          team
            ? mine
              ? "foil-underline font-semibold"
              : "font-medium"
            : "text-xs text-muted"
        }`}
      >
        {team ? team.name : (label ?? "TBD")}
      </span>
    </span>
  );
}

function NextMatchHero({
  fixture,
  myTeamIds,
}: {
  fixture: FixtureWithTeams;
  myTeamIds: Set<string>;
}) {
  return (
    <div className="card relative overflow-hidden p-4 sm:p-5">
      <div className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-accent via-gold to-accent" />

      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="text-[0.65rem] font-semibold uppercase tracking-[0.18em] text-muted">
          Next up · {FIXTURE_STAGE_LABELS[fixture.stage]}
        </span>
        <Countdown iso={fixture.kickoff.toISOString()} />
      </div>

      <div className="mt-4 flex items-center justify-center gap-3 sm:gap-8">
        <HeroSide
          team={fixture.homeTeam}
          label={fixture.homeLabel}
          mine={!!fixture.homeTeamId && myTeamIds.has(fixture.homeTeamId)}
        />
        <span className="shrink-0 text-xs font-medium text-muted">vs</span>
        <HeroSide
          team={fixture.awayTeam}
          label={fixture.awayLabel}
          mine={!!fixture.awayTeamId && myTeamIds.has(fixture.awayTeamId)}
        />
      </div>

      <p className="mt-4 text-center text-xs text-muted">
        <LocalDateTime iso={fixture.kickoff.toISOString()} /> ·{" "}
        {venueCity(fixture.venue)}
      </p>
    </div>
  );
}

// ---------- main ----------

export function FixtureList({
  fixtures,
  myTeamIds,
}: {
  fixtures: FixtureWithTeams[];
  myTeamIds: string[];
}) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const mine = new Set(myTeamIds);
  const upcoming = fixtures.filter((f) => !isPlayed(f));
  const played = fixtures.filter(isPlayed).reverse(); // most recent first
  const hero = upcoming[0] ?? null;
  const rest = upcoming.slice(1);

  if (fixtures.length === 0) {
    return (
      <p className="px-2 py-3 text-sm text-muted">
        No fixtures for your teams yet — knockout match-ups appear here once
        they’re confirmed.
      </p>
    );
  }

  return (
    <div className="space-y-3">
      {hero && <NextMatchHero fixture={hero} myTeamIds={mine} />}

      {rest.length > 0 && (
        <div className="card px-2 pb-2 sm:px-3">
          <DayGroups fixtures={rest} myTeamIds={mine} mounted={mounted} />
        </div>
      )}

      {played.length > 0 && (
        <div className="card px-2 pb-2 sm:px-3">
          <div className="flex items-center gap-3 px-1 pt-3">
            <span className="text-[0.65rem] font-semibold uppercase tracking-[0.18em] text-gold/80">
              Results
            </span>
            <span className="h-px flex-1 bg-line" />
          </div>
          <DayGroups fixtures={played} myTeamIds={mine} mounted={mounted} />
        </div>
      )}
    </div>
  );
}
