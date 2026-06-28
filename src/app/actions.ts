"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { customAlphabet } from "nanoid";
import type { DrawMode, Stage, TournamentStage } from "@prisma/client";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { isAdmin } from "@/lib/admin";
import { runSeededDraw, runSweepstakeDraw } from "@/lib/draft";
import { STAGE_ORDER } from "@/lib/scoring";

// Unambiguous alphabet for invite codes (no 0/O, 1/I/L).
const inviteCode = customAlphabet("23456789ABCDEFGHJKMNPQRSTUVWXYZ", 6);

async function requireUser() {
  const session = await auth();
  if (!session?.user) redirect("/");
  return session.user;
}

// ---------- Onboarding ----------

export async function setUsername(formData: FormData) {
  const user = await requireUser();
  const username = String(formData.get("username") ?? "")
    .trim()
    .slice(0, 24);

  if (!/^[a-zA-Z0-9_]{3,24}$/.test(username)) {
    return { error: "3–24 characters, letters, numbers and _ only." };
  }

  try {
    await db.user.update({ where: { id: user.id }, data: { username } });
  } catch {
    return { error: "That username is taken — try another." };
  }
  redirect("/");
}

// ---------- Leagues ----------

export async function createLeague(formData: FormData) {
  const user = await requireUser();
  const name = String(formData.get("name") ?? "").trim().slice(0, 50);
  if (name.length < 3) return { error: "League name needs 3+ characters." };

  // "" = split all 48 evenly; otherwise a fixed number per member.
  const rawPer = String(formData.get("teamsPerPlayer") ?? "");
  const teamsPerPlayer =
    rawPer === "" ? null : Math.floor(Number(rawPer)) || null;
  if (teamsPerPlayer !== null && (teamsPerPlayer < 1 || teamsPerPlayer > 24)) {
    return { error: "Teams per member must be between 1 and 24." };
  }

  const drawMode: DrawMode =
    formData.get("drawMode") === "SEEDED" ? "SEEDED" : "LUCKY_DIP";

  const league = await db.league.create({
    data: {
      name,
      inviteCode: inviteCode(),
      ownerId: user.id,
      teamsPerPlayer,
      drawMode,
      members: { create: { userId: user.id } },
    },
  });
  redirect(`/league/${league.inviteCode}`);
}

export async function joinLeague(code: string) {
  const user = await requireUser();
  const league = await db.league.findUnique({ where: { inviteCode: code } });

  if (!league) return { error: "No league found for that invite." };
  if (league.status === "DRAFTED") {
    return { error: "This league has already drawn its teams." };
  }

  await db.membership.upsert({
    where: { leagueId_userId: { leagueId: league.id, userId: user.id } },
    update: {},
    create: { leagueId: league.id, userId: user.id },
  });
  redirect(`/league/${code}`);
}

export async function updateTeamsPerPlayer(
  leagueId: string,
  teamsPerPlayer: number | null,
) {
  const user = await requireUser();
  const league = await db.league.findUnique({ where: { id: leagueId } });

  if (!league) return { error: "League not found." };
  if (league.ownerId !== user.id) {
    return { error: "Only the league creator can change this." };
  }
  if (league.status === "DRAFTED") {
    return { error: "Teams are already drawn — the setting is locked." };
  }
  if (
    teamsPerPlayer !== null &&
    (!Number.isInteger(teamsPerPlayer) ||
      teamsPerPlayer < 1 ||
      teamsPerPlayer > 24)
  ) {
    return { error: "Teams per member must be between 1 and 24." };
  }

  await db.league.update({
    where: { id: leagueId },
    data: { teamsPerPlayer },
  });

  revalidatePath(`/league/${league.inviteCode}`);
}

export async function updateDrawMode(leagueId: string, drawMode: DrawMode) {
  const user = await requireUser();
  const league = await db.league.findUnique({ where: { id: leagueId } });

  if (!league) return { error: "League not found." };
  if (league.ownerId !== user.id) {
    return { error: "Only the league creator can change this." };
  }
  if (league.status === "DRAFTED") {
    return { error: "Teams are already drawn — the setting is locked." };
  }
  if (drawMode !== "LUCKY_DIP" && drawMode !== "SEEDED") {
    return { error: "Unknown draw mode." };
  }

  await db.league.update({ where: { id: leagueId }, data: { drawMode } });

  revalidatePath(`/league/${league.inviteCode}`);
}

export async function deleteLeague(leagueId: string) {
  const user = await requireUser();
  const league = await db.league.findUnique({ where: { id: leagueId } });

  if (!league) return { error: "League not found." };
  if (league.ownerId !== user.id) {
    return { error: "Only the league creator can delete it." };
  }

  // Memberships and picks cascade-delete with the league.
  await db.league.delete({ where: { id: leagueId } });

  revalidatePath("/");
  redirect("/");
}

export async function leaveLeague(leagueId: string) {
  const user = await requireUser();
  const league = await db.league.findUnique({ where: { id: leagueId } });

  if (!league) return { error: "League not found." };
  if (league.ownerId === user.id) {
    return { error: "The creator can’t leave — delete the league instead." };
  }
  if (league.status === "DRAFTED") {
    return { error: "Teams are already drawn — you can’t leave now." };
  }

  await db.membership.deleteMany({
    where: { leagueId, userId: user.id },
  });

  revalidatePath("/");
  redirect("/");
}

// ---------- The draw ----------

/**
 * Deals teams for a league according to its draw mode and returns the
 * Pick rows to insert, or an error. Shared by runDraft and redrawLeague.
 */
async function dealTeams(league: {
  id: string;
  teamsPerPlayer: number | null;
  drawMode: DrawMode;
  members: { userId: string }[];
}): Promise<
  | { error: string }
  | { picks: { leagueId: string; userId: string; teamId: string }[] }
> {
  const teams = await db.team.findMany({
    select: { id: true, fifaRank: true },
  });
  if (
    league.teamsPerPlayer != null &&
    league.teamsPerPlayer * league.members.length > teams.length
  ) {
    return {
      error:
        `Not enough teams for ${league.members.length} members × ` +
        `${league.teamsPerPlayer} each. Lower the count or remove members.`,
    };
  }

  const memberIds = league.members.map((m) => m.userId);
  const assignments =
    league.drawMode === "SEEDED"
      ? runSeededDraw(
          [...teams]
            .sort((a, b) => (a.fifaRank ?? 999) - (b.fifaRank ?? 999))
            .map((t) => t.id),
          memberIds,
          league.teamsPerPlayer,
        )
      : runSweepstakeDraw(
          teams.map((t) => t.id),
          memberIds,
          league.teamsPerPlayer,
        );

  return {
    picks: [...assignments.entries()].flatMap(([userId, teamIds]) =>
      teamIds.map((teamId) => ({ leagueId: league.id, userId, teamId })),
    ),
  };
}

export async function runDraft(
  leagueId: string,
): Promise<{ error: string } | undefined> {
  const user = await requireUser();
  const league = await db.league.findUnique({
    where: { id: leagueId },
    include: { members: true },
  });

  if (!league) return { error: "League not found." };
  if (league.ownerId !== user.id) {
    return { error: "Only the league owner can run the draw." };
  }
  if (league.status === "DRAFTED") {
    return { error: "The draw has already been run." };
  }

  const dealt = await dealTeams(league);
  if ("error" in dealt) return dealt;

  // Atomic: either the whole draw lands or none of it does.
  await db.$transaction([
    db.pick.createMany({ data: dealt.picks }),
    db.league.update({
      where: { id: leagueId },
      data: { status: "DRAFTED", draftedAt: new Date() },
    }),
  ]);

  revalidatePath(`/league/${league.inviteCode}`);
}

export async function redrawLeague(
  leagueId: string,
  options?: { drawMode?: DrawMode; teamsPerPlayer?: number | null },
): Promise<{ error: string } | undefined> {
  const user = await requireUser();
  const league = await db.league.findUnique({
    where: { id: leagueId },
    include: { members: true },
  });

  if (!league) return { error: "League not found." };
  if (league.ownerId !== user.id) {
    return { error: "Only the league owner can redraw." };
  }
  if (league.status !== "DRAFTED") {
    return { error: "Run the draw first — there’s nothing to redraw." };
  }

  // Optional new settings, applied as part of the redraw.
  const drawMode = options?.drawMode ?? league.drawMode;
  if (drawMode !== "LUCKY_DIP" && drawMode !== "SEEDED") {
    return { error: "Unknown draw mode." };
  }
  const teamsPerPlayer =
    options?.teamsPerPlayer === undefined
      ? league.teamsPerPlayer
      : options.teamsPerPlayer;
  if (
    teamsPerPlayer !== null &&
    (!Number.isInteger(teamsPerPlayer) ||
      teamsPerPlayer < 1 ||
      teamsPerPlayer > 24)
  ) {
    return { error: "Teams per member must be between 1 and 24." };
  }

  // Fairness guard, relative to THIS league's draw: results that existed
  // before the draw were already known when teams were dealt, so they
  // don't block a redraw (late leagues stay flexible). But once a match
  // that kicked off after the draw has a result, new information has
  // arrived and the deal is final.
  const draftedAt = league.draftedAt ?? league.createdAt;
  const newResults = await db.fixture.count({
    where: { homeScore: { not: null }, kickoff: { gt: draftedAt } },
  });
  if (newResults > 0) {
    return {
      error: "Results have come in since your draw — the deal is final.",
    };
  }

  const dealt = await dealTeams({ ...league, drawMode, teamsPerPlayer });
  if ("error" in dealt) return dealt;

  // Atomic: settings + old deal only change if the new deal lands.
  await db.$transaction([
    db.league.update({
      where: { id: leagueId },
      data: { drawMode, teamsPerPlayer },
    }),
    db.pick.deleteMany({ where: { leagueId } }),
    db.pick.createMany({ data: dealt.picks }),
  ]);

  revalidatePath(`/league/${league.inviteCode}`);
}

// ---------- Admin: tournament stage ----------

export async function setTournamentStage(
  stage: TournamentStage,
): Promise<{ error: string } | undefined> {
  const session = await auth();
  if (!isAdmin(session?.user?.email)) return { error: "Admins only." };
  if (stage !== "GROUP" && stage !== "KNOCKOUT") {
    return { error: "Unknown stage." };
  }

  await db.appConfig.upsert({
    where: { id: "global" },
    update: { stage },
    create: { id: "global", stage },
  });

  revalidatePath("/admin");
  revalidatePath("/league/[code]", "page");
  revalidatePath("/standings/[code]", "page");
}

// ---------- Admin: tournament progress ----------

export type SaveState = { ok: true; savedAt: number } | { error: string } | null;

export async function updateTeamProgress(
  _prev: SaveState,
  formData: FormData,
): Promise<SaveState> {
  const session = await auth();
  if (!isAdmin(session?.user?.email)) return { error: "Admins only." };

  const teamId = String(formData.get("teamId"));
  const stage = String(formData.get("stage")) as Stage;
  const eliminated = formData.get("eliminated") === "on";

  if (!STAGE_ORDER.includes(stage)) return { error: "Unknown stage." };

  await db.team.update({
    where: { id: teamId },
    data: { stage, eliminated },
  });

  revalidatePath("/admin");
  revalidatePath("/league/[code]", "page");
  return { ok: true, savedAt: Date.now() };
}

// ---------- Admin: fixtures ----------

export async function updateFixture(
  _prev: SaveState,
  formData: FormData,
): Promise<SaveState> {
  const session = await auth();
  if (!isAdmin(session?.user?.email)) return { error: "Admins only." };

  const fixtureId = String(formData.get("fixtureId"));

  // "" means TBD / placeholder still shown.
  const rawHome = String(formData.get("homeTeamId") ?? "");
  const rawAway = String(formData.get("awayTeamId") ?? "");
  const homeTeamId = rawHome === "" ? null : rawHome;
  const awayTeamId = rawAway === "" ? null : rawAway;
  if (homeTeamId && awayTeamId && homeTeamId === awayTeamId) {
    return { error: "A team can’t play itself." };
  }

  // Kickoff comes from a datetime-local input, treated as UTC.
  const rawKickoff = String(formData.get("kickoff") ?? "");
  const kickoff = new Date(`${rawKickoff}:00Z`);
  if (Number.isNaN(kickoff.getTime())) {
    return { error: "Invalid kickoff date/time." };
  }

  const venue = String(formData.get("venue") ?? "").trim().slice(0, 80);
  if (venue.length < 2) return { error: "Venue needs 2+ characters." };

  const parseScore = (field: string): number | null | { error: string } => {
    const raw = String(formData.get(field) ?? "").trim();
    if (raw === "") return null;
    const n = Number(raw);
    if (!Number.isInteger(n) || n < 0 || n > 99) {
      return { error: "Scores must be whole numbers from 0 to 99." };
    }
    return n;
  };
  const homeScore = parseScore("homeScore");
  if (homeScore !== null && typeof homeScore === "object") return homeScore;
  const awayScore = parseScore("awayScore");
  if (awayScore !== null && typeof awayScore === "object") return awayScore;
  if ((homeScore == null) !== (awayScore == null)) {
    return { error: "Enter both scores (or neither)." };
  }

  await db.fixture.update({
    where: { id: fixtureId },
    data: { homeTeamId, awayTeamId, kickoff, venue, homeScore, awayScore },
  });

  revalidatePath("/admin");
  revalidatePath("/league/[code]", "page");
  return { ok: true, savedAt: Date.now() };
}
