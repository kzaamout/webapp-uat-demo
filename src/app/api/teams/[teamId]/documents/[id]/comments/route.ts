import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { requireApiRole, HttpError } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { commentSchema } from "@/lib/validation";
import { isDemoBugEnabled } from "@/lib/demo-bugs";

// POST-only, deliberately — no GET here. Comment data is read back via the
// document detail page's own server-side fetch, not a separate API contract.
// This also means backend verification for comments is forced through a direct
// Postgres read rather than the API, exercising both of webapp-uat's
// verification paths (API-covered vs. direct-store-read) across this one app.
export async function POST(req: NextRequest, { params }: { params: { teamId: string; id: string } }) {
  try {
    const { session } = await requireApiRole(params.teamId, ["ADMIN", "EDITOR", "GUEST"]);
    const parsed = commentSchema.safeParse(await req.json().catch(() => null));
    if (!parsed.success) {
      return NextResponse.json({ error: "Comment body is required (max 2000 characters)" }, { status: 400 });
    }

    try {
      const comment = await prisma.comment.create({
        data: { documentId: params.id, authorId: session.userId, body: parsed.data.body },
      });
      return NextResponse.json({ id: comment.id, success: true });
    } catch (dbError) {
      // Comment.body's DB column (VarChar(1000)) is narrower than this schema's
      // validated max (2000) — a deliberate, permanent latent inconsistency (see
      // schema.prisma). A body between 1001-2000 chars passes validation above,
      // then Postgres rejects the insert here. By default that failure correctly
      // propagates. With the bug enabled, it's swallowed instead — the seam this
      // whole app exists to let webapp-uat's backend verification catch.
      const isValueTooLong =
        dbError instanceof Prisma.PrismaClientKnownRequestError && dbError.code === "P2000";
      if (isValueTooLong && isDemoBugEnabled("silent-comment-failure")) {
        console.error("[demo-bug: silent-comment-failure] swallowed a real P2000 error:", dbError);
        return NextResponse.json({ success: true });
      }
      throw dbError;
    }
  } catch (err) {
    if (err instanceof HttpError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    return NextResponse.json({ error: "Comment could not be saved" }, { status: 500 });
  }
}
