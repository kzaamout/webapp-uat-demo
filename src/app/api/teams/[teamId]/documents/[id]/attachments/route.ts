import { NextRequest, NextResponse } from "next/server";
import { requireApiRole, HttpError } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { saveUpload } from "@/lib/upload";

export async function POST(req: NextRequest, { params }: { params: { teamId: string; id: string } }) {
  try {
    await requireApiRole(params.teamId, ["ADMIN", "EDITOR"]);
    const document = await prisma.document.findUnique({ where: { id: params.id } });
    if (!document || document.teamId !== params.teamId) throw new HttpError(404, "Not found");

    const form = await req.formData();
    const file = form.get("file");
    if (!(file instanceof File)) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    const saved = await saveUpload(file);
    const attachment = await prisma.attachment.create({
      data: { documentId: params.id, ...saved },
    });
    return NextResponse.json({ id: attachment.id }, { status: 201 });
  } catch (err) {
    if (err instanceof HttpError) return NextResponse.json({ error: err.message }, { status: err.status });
    return NextResponse.json({ error: "Upload failed" }, { status: 500 });
  }
}
