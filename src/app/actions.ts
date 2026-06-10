"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { customAlphabet } from "nanoid";
import type { Stage } from "@prisma/client";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { isAdmin } from "@/lib/admin";
import { runSweepstakeDraw } from "@/lib/draft";
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

  const league = await db.league.create({
    data: {
      name,
      inviteCode: inviteCode(),
      ownerId: user.id,
      teamsPerPlayer,
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

export async function runDraft(leagueId: string) {
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

  const teams = await db.team.findMany({ select: { id: true } });
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

  const assignments = runSweepstakeDraw(
    teams.map((t) => t.id),
    league.members.map((m) => m.userId),
    league.teamsPerPlayer,
  );

  const picks = [...assignments.entries()].flatMap(([userId, teamIds]) =>
    teamIds.map((teamId) => ({ leagueId, userId, teamId })),
  );

  // Atomic: either the whole draw lands or none of it does.
  await db.$transaction([
    db.pick.createMany({ data: picks }),
    db.league.update({
      where: { id: leagueId },
      data: { status: "DRAFTED" },
    }),
  ]);

  revalidatePath(`/league/${league.inviteCode}`);
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
