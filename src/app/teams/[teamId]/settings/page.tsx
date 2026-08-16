import Link from "next/link";
import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { Nav } from "@/components/Nav";

export default async function TeamSettingsPage({ params }: { params: { teamId: string } }) {
  const { membership } = await requireRole(params.teamId, ["ADMIN", "EDITOR", "GUEST"]);
  const team = await prisma.team.findUniqueOrThrow({ where: { id: params.teamId } });

  return (
    <main className="mx-auto max-w-2xl px-4 py-10">
      <Nav teamId={team.id} teamName={team.name} role={membership.role} />
      <h1 className="mb-6 text-2xl font-semibold">Team settings</h1>
      <dl className="space-y-2 text-sm">
        <div>
          <dt className="font-medium">Team name</dt>
          <dd className="text-gray-600">{team.name}</dd>
        </div>
        <div>
          <dt className="font-medium">Slug</dt>
          <dd className="text-gray-600">{team.slug}</dd>
        </div>
      </dl>
      {membership.role === "ADMIN" && (
        <Link
          href={`/teams/${team.id}/settings/members`}
          className="mt-6 inline-block text-sm text-blue-600 underline"
        >
          Manage members →
        </Link>
      )}
    </main>
  );
}
