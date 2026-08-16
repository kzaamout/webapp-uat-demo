import { requireUser } from "@/lib/auth";
import { LogoutButton } from "@/components/LogoutButton";

export default async function ProfilePage() {
  const session = await requireUser();

  return (
    <main className="mx-auto max-w-md px-4 py-10">
      <h1 className="mb-6 text-2xl font-semibold">Your account</h1>
      <dl className="space-y-2 text-sm">
        <div>
          <dt className="font-medium">Name</dt>
          <dd className="text-gray-600">{session.name}</dd>
        </div>
        <div>
          <dt className="font-medium">Email</dt>
          <dd className="text-gray-600">{session.email}</dd>
        </div>
      </dl>
      <div className="mt-6">
        <LogoutButton />
      </div>
    </main>
  );
}
