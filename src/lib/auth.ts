import bcrypt from "bcryptjs";
import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { redirect, notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { isDemoBugEnabled } from "@/lib/demo-bugs";
import type { Role } from "@prisma/client";

export const SESSION_COOKIE = "demo_session";
const secret = new TextEncoder().encode(
  process.env.SESSION_SECRET ?? "insecure-dev-secret-do-not-use-in-real-deployments"
);

export class HttpError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

type SessionPayload = { userId: string; email: string; name: string };

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export async function createSessionCookie(payload: SessionPayload): Promise<string> {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(secret);
}

async function verifySessionToken(token: string): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, secret);
    return payload as unknown as SessionPayload;
  } catch {
    return null;
  }
}

/** Reads the session cookie. Returns null if absent/invalid — no side effects. */
export async function getSession(): Promise<SessionPayload | null> {
  const token = cookies().get(SESSION_COOKIE)?.value;
  if (!token) return null;
  return verifySessionToken(token);
}

/** For Server Components: get the current user or redirect to /login. */
export async function requireUser(): Promise<SessionPayload> {
  const session = await getSession();
  if (!session) redirect("/login");
  return session;
}

/**
 * For Server Components: require the current user to hold one of `allowedRoles`
 * in `teamId`. Not a member at all -> notFound() (cross-tenant isolation, always
 * enforced, never gated by any demo bug toggle). Wrong role -> notFound(), UNLESS
 * DEMO_BUG_PERMISSION_BYPASS is enabled, in which case the role check is skipped
 * entirely. This one function is the single choke point both the members page and
 * its API route call, so the bug's gating stays auditable in one place.
 */
export async function requireRole(teamId: string, allowedRoles: Role[]) {
  const session = await requireUser();
  const membership = await prisma.membership.findUnique({
    where: { userId_teamId: { userId: session.userId, teamId } },
  });
  if (!membership) notFound(); // cross-tenant isolation — always enforced
  if (!allowedRoles.includes(membership.role) && !isDemoBugEnabled("permission-bypass")) {
    notFound();
  }
  return { session, membership };
}

/** API-route equivalent of requireUser — throws HttpError instead of redirecting. */
export async function requireApiUser(): Promise<SessionPayload> {
  const session = await getSession();
  if (!session) throw new HttpError(401, "Not authenticated");
  return session;
}

/** API-route equivalent of requireRole — same bypass gate as requireRole above. */
export async function requireApiRole(teamId: string, allowedRoles: Role[]) {
  const session = await requireApiUser();
  const membership = await prisma.membership.findUnique({
    where: { userId_teamId: { userId: session.userId, teamId } },
  });
  if (!membership) throw new HttpError(404, "Not found");
  if (!allowedRoles.includes(membership.role) && !isDemoBugEnabled("permission-bypass")) {
    throw new HttpError(403, "Forbidden");
  }
  return { session, membership };
}
