import type { TournamentStage } from "@prisma/client";
import { db } from "@/lib/db";

/**
 * Global tournament phase (group stage vs knockouts), stored in the
 * singleton AppConfig row. Defaults to GROUP until an admin flips it.
 * Drives which view members see first — group tables or the bracket.
 */
export async function getTournamentStage(): Promise<TournamentStage> {
  const cfg = await db.appConfig.findUnique({ where: { id: "global" } });
  return cfg?.stage ?? "GROUP";
}
