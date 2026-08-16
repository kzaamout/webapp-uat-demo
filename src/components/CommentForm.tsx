"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";

export function CommentForm({ teamId, documentId }: { teamId: string; documentId: string }) {
  const router = useRouter();
  const [body, setBody] = useState("");
  const [status, setStatus] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setStatus(null);
    const res = await fetch(`/api/teams/${teamId}/documents/${documentId}/comments`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ body }),
    });
    setSubmitting(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({ error: "Comment failed" }));
      setStatus(data.error ?? "Comment failed");
      return;
    }
    setBody("");
    setStatus("Comment added.");
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="mt-4 space-y-2">
      <label htmlFor="comment-body" className="block text-sm font-medium">
        Add a comment
      </label>
      <textarea
        id="comment-body"
        name="body"
        required
        maxLength={2000}
        rows={3}
        value={body}
        onChange={(e) => setBody(e.target.value)}
        className="w-full rounded border border-gray-300 px-3 py-2 text-sm"
      />
      {status && (
        <p role="status" className="text-sm text-gray-600">
          {status}
        </p>
      )}
      <button
        type="submit"
        disabled={submitting || body.length === 0}
        className="rounded border border-gray-300 px-3 py-1.5 text-sm disabled:opacity-50"
      >
        {submitting ? "Posting..." : "Post comment"}
      </button>
    </form>
  );
}
