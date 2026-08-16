import Link from "next/link";

export function Nav({
  teamId,
  teamName,
  role,
}: {
  teamId: string;
  teamName: string;
  role: string;
}) {
  return (
    <nav className="mb-6 flex flex-wrap items-center gap-4 border-b border-gray-200 pb-4 text-sm">
      <Link href="/teams" className="font-medium">
        ← Teams
      </Link>
      <span className="text-gray-400">/</span>
      <span className="font-medium">{teamName}</span>
      <Link href={`/teams/${teamId}/documents`} className="text-gray-600 hover:underline">
        Documents
      </Link>
      {role === "ADMIN" && (
        <Link href={`/teams/${teamId}/settings/members`} className="text-gray-600 hover:underline">
          Members
        </Link>
      )}
      <Link href={`/teams/${teamId}/settings`} className="text-gray-600 hover:underline">
        Settings
      </Link>
      <span className="ml-auto text-gray-400">Signed in as {role}</span>
    </nav>
  );
}
