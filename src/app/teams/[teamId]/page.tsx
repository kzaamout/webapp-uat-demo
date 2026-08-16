import Link from "next/link";
import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { Nav } from "@/components/Nav";

export default async function TeamDashboardPage({ params }: { params: { teamId: string } }) {
  const { membership } = await requireRole(params.teamId, ["ADMIN", "EDITOR", "GUEST"]);
  const team = await prisma.team.findUniqueOrThrow({ where: { id: params.teamId } });
  const documentCount = await prisma.document.count({ where: { teamId: params.teamId } });

  return (
    <main className="mx-auto max-w-2xl px-4 py-10">
      <Nav teamId={team.id} teamName={team.name} role={membership.role} />
      <h1 className="mb-2 text-2xl font-semibold">{team.name}</h1>
      <p className="mb-6 text-gray-600">{documentCount} document{documentCount === 1 ? "" : "s"}</p>
      <Link
        href={`/teams/${team.id}/documents`}
        className="inline-block rounded bg-gray-900 px-4 py-2 text-white"
      >
        Browse documents
      </Link>
    </main>
  );
}
