import { NextRequest, NextResponse } from "next/server";
import { readFile } from "node:fs/promises";
import { requireApiRole, HttpError } from "@/lib/auth";
import { prisma } from "@/lib/db";

// The only way to fetch an attachment's bytes — deliberately not served from
// public/, so a private/team-visibility document's attachment can't be reached
// by guessing a static URL. Visibility is enforced the same way document reads
// are: requireApiRole confirms team membership; the attachment is only ever
// looked up scoped to a document already confirmed to belong to this team.
export async function GET(
  req: NextRequest,
  { params }: { params: { teamId: string; id: string; aid: string } }
) {
  try {
    await requireApiRole(params.teamId, ["ADMIN", "EDITOR", "GUEST"]);
    const document = await prisma.document.findUnique({ where: { id: params.id } });
    if (!document || document.teamId !== params.teamId) throw new HttpError(404, "Not found");

    const attachment = await prisma.attachment.findUnique({ where: { id: params.aid } });
    if (!attachment || attachment.documentId !== params.id) throw new HttpError(404, "Not found");

    const bytes = await readFile(attachment.storagePath);
    return new NextResponse(bytes, {
      headers: {
        "Content-Type": attachment.mimeType,
        "Content-Disposition": `attachment; filename="${attachment.filename}"`,
      },
    });
  } catch (err) {
    if (err instanceof HttpError) return NextResponse.json({ error: err.message }, { status: err.status });
    return NextResponse.json({ error: "Could not read attachment" }, { status: 500 });
  }
}
