"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";

// DEMO_BUG_A11Y_MISSING_LABELS seam: when enabled, the file input loses its
// <label htmlFor> association and the attachment preview loses its alt text.
// Off by default — see README.md.
const A11Y_BUG_ENABLED = process.env.NEXT_PUBLIC_DEMO_BUG_A11Y_MISSING_LABELS === "1";

type DocumentFormProps = {
  teamId: string;
  document?: {
    id: string;
    title: string;
    body: string;
    tags: string[];
    visibility: "PRIVATE" | "TEAM" | "PUBLIC";
  };
};

export function DocumentForm({ teamId, document }: DocumentFormProps) {
  const router = useRouter();
  const [title, setTitle] = useState(document?.title ?? "");
  const [body, setBody] = useState(document?.body ?? "");
  const [tags, setTags] = useState(document?.tags.join(", ") ?? "");
  const [visibility, setVisibility] = useState(document?.visibility ?? "TEAM");
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    const payload = {
      title,
      body,
      tags: tags
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean),
      visibility,
    };

    const url = document
      ? `/api/teams/${teamId}/documents/${document.id}`
      : `/api/teams/${teamId}/documents`;
    const method = document ? "PATCH" : "POST";

    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const data = await res.json().catch(() => ({ error: "Save failed" }));
      setError(data.error ?? "Save failed");
      setSubmitting(false);
      return;
    }

    const saved = await res.json();
    const documentId = document?.id ?? saved.id;

    if (file) {
      const form = new FormData();
      form.append("file", file);
      const uploadRes = await fetch(`/api/teams/${teamId}/documents/${documentId}/attachments`, {
        method: "POST",
        body: form,
      });
      if (!uploadRes.ok) {
        const data = await uploadRes.json().catch(() => ({ error: "Upload failed" }));
        setError(`Document saved, but the attachment failed: ${data.error ?? "unknown error"}`);
        setSubmitting(false);
        return;
      }
    }

    setSubmitting(false);
    router.push(`/teams/${teamId}/documents/${documentId}`);
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4" noValidate>
      <div>
        <label htmlFor="title" className="block text-sm font-medium">
          Title
        </label>
        <input
          id="title"
          name="title"
          type="text"
          required
          minLength={3}
          maxLength={120}
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="mt-1 w-full rounded border border-gray-300 px-3 py-2"
        />
      </div>

      <div>
        <label htmlFor="body" className="block text-sm font-medium">
          Body
        </label>
        <textarea
          id="body"
          name="body"
          required
          minLength={10}
          maxLength={5000}
          rows={8}
          value={body}
          onChange={(e) => setBody(e.target.value)}
          className="mt-1 w-full rounded border border-gray-300 px-3 py-2"
        />
      </div>

      <div>
        <label htmlFor="tags" className="block text-sm font-medium">
          Tags (comma-separated, up to 5)
        </label>
        <input
          id="tags"
          name="tags"
          type="text"
          value={tags}
          onChange={(e) => setTags(e.target.value)}
          placeholder="engineering, planning"
          className="mt-1 w-full rounded border border-gray-300 px-3 py-2"
        />
      </div>

      <div>
        <label htmlFor="visibility" className="block text-sm font-medium">
          Visibility
        </label>
        <select
          id="visibility"
          name="visibility"
          value={visibility}
          onChange={(e) => setVisibility(e.target.value as typeof visibility)}
          className="mt-1 w-full rounded border border-gray-300 px-3 py-2"
        >
          <option value="PRIVATE">Private (only me)</option>
          <option value="TEAM">Team</option>
          <option value="PUBLIC">Public</option>
        </select>
      </div>

      <div>
        {A11Y_BUG_ENABLED ? (
          // Seeded bug: no <label htmlFor> association — axe-core should catch this.
          <span className="block text-sm font-medium">Attachment (optional)</span>
        ) : (
          <label htmlFor="attachment" className="block text-sm font-medium">
            Attachment (optional)
          </label>
        )}
        <input
          id={A11Y_BUG_ENABLED ? undefined : "attachment"}
          name="attachment"
          type="file"
          accept="application/pdf,image/png,image/jpeg"
          onChange={(e) => setFile(e.target.files?.[0] ?? null)}
          className="mt-1 w-full text-sm"
        />
        {file && file.type.startsWith("image/") && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={URL.createObjectURL(file)}
            alt={A11Y_BUG_ENABLED ? "" : `Preview of ${file.name}`}
            className="mt-2 h-24 w-24 rounded object-cover"
          />
        )}
      </div>

      {error && (
        <p role="alert" className="text-sm text-red-600">
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={submitting}
        className="rounded bg-gray-900 px-4 py-2 text-white disabled:opacity-50"
      >
        {submitting ? "Saving..." : document ? "Save changes" : "Create document"}
      </button>
    </form>
  );
}
