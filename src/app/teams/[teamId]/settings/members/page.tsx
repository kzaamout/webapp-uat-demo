import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { Nav } from "@/components/Nav";
import { MembersTable } from "@/components/MembersTable";

// The permission-bug demo target: with DEMO_BUG_PERMISSION_BYPASS unset (the
// default), only ADMIN reaches this page — requireRole's own check, nothing else
// gates it. Enabling the bug (see auth.ts) skips that check here and in the
// paired /api/teams/[teamId]/members route.
export default async function TeamMembersPage({ params }: { params: { teamId: string } }) {
  const { session, membership } = await requireRole(params.teamId, ["ADMIN"]);
  const team = await prisma.team.findUniqueOrThrow({ where: { id: params.teamId } });
  const memberships = await prisma.membership.findMany({
    where: { teamId: params.teamId },
    include: { user: true },
    orderBy: { user: { name: "asc" } },
  });

  return (
    <main className="mx-auto max-w-2xl px-4 py-10">
      <Nav teamId={team.id} teamName={team.name} role={membership.role} />
      <h1 className="mb-6 text-2xl font-semibold">Members</h1>
      <MembersTable
        teamId={team.id}
        currentUserId={session.userId}
        members={memberships.map((m) => ({
          userId: m.userId,
          name: m.user.name,
          email: m.user.email,
          role: m.role,
        }))}
      />
    </main>
  );
}
