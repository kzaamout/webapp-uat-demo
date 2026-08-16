import Link from "next/link";
import { notFound } from "next/navigation";
import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { Nav } from "@/components/Nav";
import { CommentForm } from "@/components/CommentForm";

export default async function DocumentDetailPage({
  params,
}: {
  params: { teamId: string; documentId: string };
}) {
  const { membership } = await requireRole(params.teamId, ["ADMIN", "EDITOR", "GUEST"]);
  const team = await prisma.team.findUniqueOrThrow({ where: { id: params.teamId } });

  const document = await prisma.document.findUnique({
    where: { id: params.documentId },
    include: {
      author: true,
      attachments: true,
      comments: { include: { author: true }, orderBy: { createdAt: "asc" } },
    },
  });

  // Cross-tenant isolation: a document that exists but belongs to a different
  // team is treated identically to a document that doesn't exist at all.
  if (!document || document.teamId !== params.teamId) notFound();

  return (
    <main className="mx-auto max-w-2xl px-4 py-10">
      <Nav teamId={team.id} teamName={team.name} role={membership.role} />

      <div className="mb-4 flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-semibold">{document.title}</h1>
          <p className="mt-1 text-sm text-gray-500">
            by {document.author.name} · {document.visibility} ·{" "}
            {document.tags.join(", ") || "no tags"}
          </p>
        </div>
        {membership.role !== "GUEST" && (
          <Link
            href={`/teams/${team.id}/documents/${document.id}/edit`}
            className="rounded border border-gray-300 px-3 py-1.5 text-sm"
          >
            Edit
          </Link>
        )}
      </div>

      <p className="whitespace-pre-wrap rounded border border-gray-200 bg-white p-4">{document.body}</p>

      {document.attachments.length > 0 && (
        <div className="mt-4">
          <h2 className="text-sm font-semibold">Attachments</h2>
          <ul className="mt-1 space-y-1">
            {document.attachments.map((a) => (
              <li key={a.id}>
                <a
                  href={`/api/teams/${team.id}/documents/${document.id}/attachments/${a.id}`}
                  className="text-sm text-blue-600 underline"
                >
                  {a.filename} ({Math.round(a.sizeBytes / 1024)} KB)
                </a>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="mt-8">
        <h2 className="text-sm font-semibold">
          Comments ({document.comments.length})
        </h2>
        <ul className="mt-2 space-y-3">
          {document.comments.map((c) => (
            <li key={c.id} className="rounded border border-gray-200 bg-white p-3 text-sm">
              <p className="font-medium">{c.author.name}</p>
              <p className="mt-1 whitespace-pre-wrap">{c.body}</p>
            </li>
          ))}
        </ul>
        <CommentForm teamId={team.id} documentId={document.id} />
      </div>
    </main>
  );
}
