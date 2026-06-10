/**
 * The sweepstake draw.
 *
 * Shuffles all teams and all members (Fisher–Yates), then deals teams
 * round-robin like a deck of cards.
 *
 * If `perMember` is set, each member receives exactly that many teams
 * and the rest of the field goes undrawn. Otherwise all teams are
 * split as evenly as possible; with 48 teams:
 *   12 members → 4 teams each
 *    8 members → 6 teams each
 *   10 members → 8 members get 5, 2 get 4 (remainder lands on a
 *                 random subset because the member order is shuffled)
 *
 * Pot fairness note: this is a pure lucky dip — someone can land both
 * Argentina and France. If your group prefers seeded fairness, deal
 * group-by-group (each FIFA pot dealt as its own round-robin pass)
 * by sorting `teamIds` by pot before dealing.
 */
export function runSweepstakeDraw(
  teamIds: string[],
  memberIds: string[],
  perMember?: number | null,
): Map<string, string[]> {
  if (memberIds.length < 2) {
    throw new Error("A sweepstake needs at least 2 members.");
  }
  if (memberIds.length > teamIds.length) {
    throw new Error("More members than teams — not everyone can get one.");
  }
  if (perMember != null) {
    if (perMember < 1) {
      throw new Error("Each member needs at least 1 team.");
    }
    if (perMember * memberIds.length > teamIds.length) {
      throw new Error(
        `Not enough teams: ${memberIds.length} members × ${perMember} teams ` +
          `needs ${perMember * memberIds.length}, but only ${teamIds.length} exist.`,
      );
    }
  }

  let teams = shuffle([...teamIds]);
  const members = shuffle([...memberIds]);

  if (perMember != null) {
    teams = teams.slice(0, perMember * members.length);
  }

  const assignments = new Map<string, string[]>(members.map((m) => [m, []]));

  teams.forEach((teamId, i) => {
    const member = members[i % members.length];
    assignments.get(member)!.push(teamId);
  });

  return assignments;
}

function shuffle<T>(arr: T[]): T[] {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}
