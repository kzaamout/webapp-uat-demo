import { NextRequest, NextResponse } from "next/server";
import { requireApiRole, HttpError } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { documentSchema } from "@/lib/validation";

async function loadScopedDocument(teamId: string, id: string) {
  const document = await prisma.document.findUnique({ where: { id } });
  if (!document || document.teamId !== teamId) {
    // Cross-tenant isolation: a real document in a different team reads
    // identically to one that doesn't exist.
    throw new HttpError(404, "Not found");
  }
  return document;
}

export async function GET(req: NextRequest, { params }: { params: { teamId: string; id: string } }) {
  try {
    await requireApiRole(params.teamId, ["ADMIN", "EDITOR", "GUEST"]);
    const document = await loadScopedDocument(params.teamId, params.id);
    return NextResponse.json(document);
  } catch (err) {
    if (err instanceof HttpError) return NextResponse.json({ error: err.message }, { status: err.status });
    return NextResponse.json({ error: "Could not load document" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest, { params }: { params: { teamId: string; id: string } }) {
  try {
    await requireApiRole(params.teamId, ["ADMIN", "EDITOR"]);
    await loadScopedDocument(params.teamId, params.id);
    const parsed = documentSchema.partial().safeParse(await req.json().catch(() => null));
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid update" }, { status: 400 });
    }
    const updated = await prisma.document.update({ where: { id: params.id }, data: parsed.data });
    return NextResponse.json(updated);
  } catch (err) {
    if (err instanceof HttpError) return NextResponse.json({ error: err.message }, { status: err.status });
    return NextResponse.json({ error: "Could not update document" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { teamId: string; id: string } }) {
  try {
    await requireApiRole(params.teamId, ["ADMIN", "EDITOR"]);
    await loadScopedDocument(params.teamId, params.id);
    await prisma.document.delete({ where: { id: params.id } });
    return NextResponse.json({ ok: true });
  } catch (err) {
    if (err instanceof HttpError) return NextResponse.json({ error: err.message }, { status: err.status });
    return NextResponse.json({ error: "Could not delete document" }, { status: 500 });
  }
}
