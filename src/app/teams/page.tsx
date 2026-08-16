import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/db";

export default async function TeamsPage() {
  const session = await requireUser();
  const memberships = await prisma.membership.findMany({
    where: { userId: session.userId },
    include: { team: true },
    orderBy: { team: { name: "asc" } },
  });

  return (
    <main className="mx-auto max-w-2xl px-4 py-10">
      <h1 className="mb-6 text-2xl font-semibold">Your teams</h1>
      {memberships.length === 0 ? (
        <p className="text-gray-600">You don&apos;t belong to any teams yet.</p>
      ) : (
        <ul className="space-y-3">
          {memberships.map((m) => (
            <li key={m.teamId}>
              <Link
                href={`/teams/${m.teamId}`}
                className="block rounded border border-gray-200 bg-white px-4 py-3 hover:border-gray-400"
              >
                <span className="font-medium">{m.team.name}</span>
                <span className="ml-2 text-sm text-gray-500">({m.role})</span>
              </Link>
            </li>
          ))}
        </ul>
      )}
      <div className="mt-8">
        <Link href="/profile" className="text-sm text-gray-600 underline">
          Account settings
        </Link>
      </div>
    </main>
  );
}
