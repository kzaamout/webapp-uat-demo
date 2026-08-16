import Link from "next/link";
import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { Nav } from "@/components/Nav";
import { DocumentList } from "@/components/DocumentList";

const PAGE_SIZE = 6;

export default async function DocumentsPage({
  params,
  searchParams,
}: {
  params: { teamId: string };
  searchParams: { q?: string; tag?: string; page?: string };
}) {
  const { session, membership } = await requireRole(params.teamId, ["ADMIN", "EDITOR", "GUEST"]);
  const team = await prisma.team.findUniqueOrThrow({ where: { id: params.teamId } });

  const page = Math.max(1, Number(searchParams.page ?? "1") || 1);
  const q = searchParams.q?.trim() ?? "";
  const tag = searchParams.tag?.trim() ?? "";

  const where = {
    teamId: params.teamId,
    OR: [{ visibility: { not: "PRIVATE" as const } }, { authorId: session.userId }],
    ...(q ? { title: { contains: q, mode: "insensitive" as const } } : {}),
    ...(tag ? { tags: { has: tag } } : {}),
  };

  const [documents, total] = await Promise.all([
    prisma.document.findMany({
      where,
      include: { author: true },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
    }),
    prisma.document.count({ where }),
  ]);

  return (
    <main className="mx-auto max-w-3xl px-4 py-10">
      <Nav teamId={team.id} teamName={team.name} role={membership.role} />
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Documents</h1>
        {membership.role !== "GUEST" && (
          <Link
            href={`/teams/${team.id}/documents/new`}
            className="rounded bg-gray-900 px-4 py-2 text-sm text-white"
          >
            New document
          </Link>
        )}
      </div>

      <form method="get" className="mb-6 flex gap-3">
        <div className="flex-1">
          <label htmlFor="q" className="sr-only">
            Search by title
          </label>
          <input
            id="q"
            name="q"
            type="text"
            defaultValue={q}
            placeholder="Search by title..."
            className="w-full rounded border border-gray-300 px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label htmlFor="tag" className="sr-only">
            Filter by tag
          </label>
          <input
            id="tag"
            name="tag"
            type="text"
            defaultValue={tag}
            placeholder="Filter by tag..."
            className="rounded border border-gray-300 px-3 py-2 text-sm"
          />
        </div>
        <button type="submit" className="rounded border border-gray-300 px-4 py-2 text-sm">
          Search
        </button>
      </form>

      <DocumentList documents={documents} teamId={team.id} />

      {total > PAGE_SIZE && (
        <nav className="mt-6 flex justify-center gap-2 text-sm" aria-label="Pagination">
          {Array.from({ length: Math.ceil(total / PAGE_SIZE) }, (_, i) => i + 1).map((p) => (
            <Link
              key={p}
              href={`?${new URLSearchParams({ ...(q && { q }), ...(tag && { tag }), page: String(p) })}`}
              className={`rounded px-3 py-1 ${p === page ? "bg-gray-900 text-white" : "border border-gray-300"}`}
              aria-current={p === page ? "page" : undefined}
            >
              {p}
            </Link>
          ))}
        </nav>
      )}
    </main>
  );
}
