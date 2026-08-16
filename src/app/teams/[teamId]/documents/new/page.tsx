import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { Nav } from "@/components/Nav";
import { DocumentForm } from "@/components/DocumentForm";

export default async function NewDocumentPage({ params }: { params: { teamId: string } }) {
  const { membership } = await requireRole(params.teamId, ["ADMIN", "EDITOR"]);
  const team = await prisma.team.findUniqueOrThrow({ where: { id: params.teamId } });

  return (
    <main className="mx-auto max-w-2xl px-4 py-10">
      <Nav teamId={team.id} teamName={team.name} role={membership.role} />
      <h1 className="mb-6 text-2xl font-semibold">New document</h1>
      <DocumentForm teamId={team.id} />
    </main>
  );
}
