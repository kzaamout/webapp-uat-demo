import Link from "next/link";

type DocumentListItem = {
  id: string;
  title: string;
  tags: string[];
  visibility: string;
  createdAt: Date;
  author: { name: string };
};

export function DocumentList({
  documents,
  teamId,
}: {
  documents: DocumentListItem[];
  teamId: string;
}) {
  if (documents.length === 0) {
    return (
      <div className="rounded border border-dashed border-gray-300 px-6 py-12 text-center text-gray-500">
        <p className="font-medium">No documents found</p>
        <p className="mt-1 text-sm">Try a different search term, or clear your filters.</p>
      </div>
    );
  }

  return (
    <ul className="divide-y divide-gray-200 rounded border border-gray-200 bg-white">
      {documents.map((doc) => (
        <li key={doc.id}>
          <Link href={`/teams/${teamId}/documents/${doc.id}`} className="block px-4 py-3 hover:bg-gray-50">
            <div className="flex items-center justify-between">
              <span className="font-medium">{doc.title}</span>
              <span className="text-xs uppercase text-gray-600">{doc.visibility}</span>
            </div>
            <div className="mt-1 text-sm text-gray-500">
              by {doc.author.name} · {doc.tags.join(", ") || "no tags"}
            </div>
          </Link>
        </li>
      ))}
    </ul>
  );
}
