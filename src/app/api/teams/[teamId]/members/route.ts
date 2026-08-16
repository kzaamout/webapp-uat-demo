import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireApiRole, HttpError } from "@/lib/auth";
import { prisma } from "@/lib/db";

// This route (alongside the /settings/members page) is the other half of the
// requireApiRole choke point DEMO_BUG_PERMISSION_BYPASS targets — see auth.ts.
// Both the page and this route call requireRole/requireApiRole and nothing else
// gates access, so enabling the bug affects both identically.

export async function GET(req: NextRequest, { params }: { params: { teamId: string } }) {
  try {
    await requireApiRole(params.teamId, ["ADMIN", "EDITOR", "GUEST"]);
    const members = await prisma.membership.findMany({
      where: { teamId: params.teamId },
      include: { user: true },
      orderBy: { user: { name: "asc" } },
    });
    return NextResponse.json({
      members: members.map((m) => ({ userId: m.userId, name: m.user.name, email: m.user.email, role: m.role })),
    });
  } catch (err) {
    if (err instanceof HttpError) return NextResponse.json({ error: err.message }, { status: err.status });
    return NextResponse.json({ error: "Could not list members" }, { status: 500 });
  }
}

const patchSchema = z.object({
  userId: z.string(),
  role: z.enum(["ADMIN", "EDITOR", "GUEST"]),
});

export async function PATCH(req: NextRequest, { params }: { params: { teamId: string } }) {
  try {
    // The permission check this whole seam exists to demonstrate: with
    // DEMO_BUG_PERMISSION_BYPASS=1, an Editor/Guest reaches this line despite
    // not being an ADMIN.
    await requireApiRole(params.teamId, ["ADMIN"]);
    const parsed = patchSchema.safeParse(await req.json().catch(() => null));
    if (!parsed.success) {
      return NextResponse.json({ error: "userId and a valid role are required" }, { status: 400 });
    }
    const updated = await prisma.membership.update({
      where: { userId_teamId: { userId: parsed.data.userId, teamId: params.teamId } },
      data: { role: parsed.data.role },
    });
    return NextResponse.json({ ok: true, role: updated.role });
  } catch (err) {
    if (err instanceof HttpError) return NextResponse.json({ error: err.message }, { status: err.status });
    return NextResponse.json({ error: "Could not update member" }, { status: 500 });
  }
}

const deleteSchema = z.object({ userId: z.string() });

export async function DELETE(req: NextRequest, { params }: { params: { teamId: string } }) {
  try {
    await requireApiRole(params.teamId, ["ADMIN"]);
    const parsed = deleteSchema.safeParse(await req.json().catch(() => null));
    if (!parsed.success) {
      return NextResponse.json({ error: "userId is required" }, { status: 400 });
    }
    await prisma.membership.delete({
      where: { userId_teamId: { userId: parsed.data.userId, teamId: params.teamId } },
    });
    return NextResponse.json({ ok: true });
  } catch (err) {
    if (err instanceof HttpError) return NextResponse.json({ error: err.message }, { status: err.status });
    return NextResponse.json({ error: "Could not remove member" }, { status: 500 });
  }
}
