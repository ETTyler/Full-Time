"use client";

import { useEffect, useState } from "react";

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTHS = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

// Deterministic UTC fallback — built by hand so the server and the
// client's first render produce identical strings regardless of each
// environment's Intl/ICU version (toLocaleString varies, e.g. comma
// placement after the weekday → hydration mismatch).
function utcLabel(d: Date) {
  const hh = String(d.getUTCHours()).padStart(2, "0");
  const mm = String(d.getUTCMinutes()).padStart(2, "0");
  return `${DAYS[d.getUTCDay()]} ${d.getUTCDate()} ${
    MONTHS[d.getUTCMonth()]
  }, ${hh}:${mm} UTC`;
}

/**
 * Renders a kickoff time in the viewer's own timezone. Server-rendered
 * output shows a stable UTC fallback, then swaps to local time on mount.
 */
export function LocalKickoff({ iso }: { iso: string }) {
  const [label, setLabel] = useState(() => utcLabel(new Date(iso)));

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
