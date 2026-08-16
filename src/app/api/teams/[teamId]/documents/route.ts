import { NextRequest, NextResponse } from "next/server";
import { requireApiRole, HttpError } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { documentSchema } from "@/lib/validation";

export async function GET(req: NextRequest, { params }: { params: { teamId: string } }) {
  try {
    const { session } = await requireApiRole(params.teamId, ["ADMIN", "EDITOR", "GUEST"]);
    const documents = await prisma.document.findMany({
      where: {
        teamId: params.teamId,
        OR: [{ visibility: { not: "PRIVATE" } }, { authorId: session.userId }],
      },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json({ documents });
  } catch (err) {
    if (err instanceof HttpError) return NextResponse.json({ error: err.message }, { status: err.status });
    return NextResponse.json({ error: "Could not list documents" }, { status: 500 });
  }
}

export async function POST(req: NextRequest, { params }: { params: { teamId: string } }) {
  try {
    const { session } = await requireApiRole(params.teamId, ["ADMIN", "EDITOR"]);
    const parsed = documentSchema.safeParse(await req.json().catch(() => null));
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid document" }, { status: 400 });
    }
    const document = await prisma.document.create({
      data: { ...parsed.data, teamId: params.teamId, authorId: session.userId },
    });
    return NextResponse.json(document, { status: 201 });
  } catch (err) {
    if (err instanceof HttpError) return NextResponse.json({ error: err.message }, { status: err.status });
    return NextResponse.json({ error: "Could not create document" }, { status: 500 });
  }
}
