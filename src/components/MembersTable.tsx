"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Member = { userId: string; name: string; email: string; role: string };

export function MembersTable({ teamId, members, currentUserId }: {
  teamId: string;
  members: Member[];
  currentUserId: string;
}) {
  const router = useRouter();
  const [pendingUserId, setPendingUserId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function changeRole(userId: string, role: string) {
    setPendingUserId(userId);
    setError(null);
    const res = await fetch(`/api/teams/${teamId}/members`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, role }),
    });
    setPendingUserId(null);
    if (!res.ok) {
      const data = await res.json().catch(() => ({ error: "Update failed" }));
      setError(data.error ?? "Update failed");
      return;
    }
    router.refresh();
  }

  return (
    <div>
      {error && (
        <p role="alert" className="mb-3 text-sm text-red-600">
          {error}
        </p>
      )}
      <table className="w-full overflow-hidden rounded border border-gray-200 bg-white text-sm">
        <caption className="sr-only">Team members and their roles</caption>
        <thead className="bg-gray-100 text-left">
          <tr>
            <th scope="col" className="px-4 py-2">Name</th>
            <th scope="col" className="px-4 py-2">Email</th>
            <th scope="col" className="px-4 py-2">Role</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200">
          {members.map((m) => (
            <tr key={m.userId}>
              <td className="px-4 py-2">{m.name}</td>
              <td className="px-4 py-2 text-gray-500">{m.email}</td>
              <td className="px-4 py-2">
                <label htmlFor={`role-${m.userId}`} className="sr-only">
                  Role for {m.name}
                </label>
                <select
                  id={`role-${m.userId}`}
                  value={m.role}
                  disabled={m.userId === currentUserId || pendingUserId === m.userId}
                  onChange={(e) => changeRole(m.userId, e.target.value)}
                  className="rounded border border-gray-300 px-2 py-1"
                >
                  <option value="ADMIN">ADMIN</option>
                  <option value="EDITOR">EDITOR</option>
                  <option value="GUEST">GUEST</option>
                </select>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
