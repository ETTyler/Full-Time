/**
 * The sweepstake draw.
 *
 * Shuffles all teams and all members (Fisher–Yates), then deals teams
 * round-robin like a deck of cards.
 *
 * Every member always receives the same number of teams. If `perMember`
 * is set, that's the number; otherwise it's the largest equal split
 * (⌊teams / members⌋). With 48 teams:
 *   12 members → 4 teams each
 *    8 members → 6 teams each
 *   10 members → 4 teams each, 8 random teams stay in the deck
 *
 * Pot fairness note: this is a pure lucky dip — someone can land both
 * Argentina and France. For seeded fairness see `runSeededDraw`.
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

  // Everyone gets exactly `per` teams; the remainder stays in the deck.
  const per = perMember ?? Math.floor(teams.length / members.length);
  teams = teams.slice(0, per * members.length);

  const assignments = new Map<string, string[]>(members.map((m) => [m, []]));

  teams.forEach((teamId, i) => {
    const member = members[i % members.length];
    assignments.get(member)!.push(teamId);
  });

  return assignments;
}

/**
 * The seeded draw — random, but fair.
 *
 * Teams are sorted by FIFA ranking and dealt in "pots" the size of the
 * member list: with 12 members, pot 1 is the top 12 seeds, pot 2 the
 * next 12, and so on. Each pot is shuffled and dealt so every member
 * receives exactly one team per pot — everyone ends up with the same
 * spread of favourites and outsiders, but who gets Argentina vs who
 * gets Haiti within a pot is still pure luck.
 *
 * Every member always receives the same number of teams — `perMember`
 * if set, otherwise the largest equal split (⌊teams / members⌋). Only
 * the top `per × members` seeds are in play; the weakest leftovers
 * stay in the deck.
 */
export function runSeededDraw(
  rankedTeamIds: string[], // sorted best → worst by FIFA ranking
  memberIds: string[],
  perMember?: number | null,
): Map<string, string[]> {
  if (memberIds.length < 2) {
    throw new Error("A sweepstake needs at least 2 members.");
  }
  if (memberIds.length > rankedTeamIds.length) {
    throw new Error("More members than teams — not everyone can get one.");
  }
  if (perMember != null) {
    if (perMember < 1) {
      throw new Error("Each member needs at least 1 team.");
    }
    if (perMember * memberIds.length > rankedTeamIds.length) {
      throw new Error(
        `Not enough teams: ${memberIds.length} members × ${perMember} teams ` +
          `needs ${perMember * memberIds.length}, but only ${rankedTeamIds.length} exist.`,
      );
    }
  }

  const members = [...memberIds];
  const n = members.length;
  let teams = [...rankedTeamIds];

  // Everyone gets exactly `per` teams; the weakest seeds beyond
  // per × members stay in the deck. Every pot is therefore full.
  const per = perMember ?? Math.floor(teams.length / n);
  teams = teams.slice(0, per * n);

  const assignments = new Map<string, string[]>(members.map((m) => [m, []]));

  for (let start = 0; start < teams.length; start += n) {
    const pot = shuffle(teams.slice(start, start + n));
    const order = shuffle([...members]); // fresh order per pot
    pot.forEach((teamId, i) => {
      assignments.get(order[i])!.push(teamId);
    });
  }

  return assignments;
}

function shuffle<T>(arr: T[]): T[] {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}
