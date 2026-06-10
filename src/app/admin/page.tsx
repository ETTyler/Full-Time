import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { isAdmin } from "@/lib/admin";
import { AdminTeamRow } from "@/components/AdminTeamRow";

export default async function AdminPage() {
  const session = await auth();
  if (!isAdmin(session?.user?.email)) redirect("/");

  const teams = await db.team.findMany({
    orderBy: [{ groupName: "asc" }, { name: "asc" }],
  });

  return (
    <div>
      <h1 className="text-2xl font-semibold">Tournament control</h1>
      <p className="mt-1 text-sm text-muted">
        Set the furthest stage each team has reached, and mark them eliminated
        once they’re out. Every leaderboard updates instantly.
      </p>

      <div className="mt-6 divide-y divide-line">
        {teams.map((team) => (
          <AdminTeamRow key={team.id} team={team} />
        ))}
      </div>
    </div>
  );
}
