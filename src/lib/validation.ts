import { z } from "zod";

export const documentSchema = z.object({
  title: z.string().min(3).max(120),
  body: z.string().min(10).max(5000),
  tags: z.array(z.string().min(2).max(24).regex(/^[a-z0-9-]+$/)).max(5).default([]),
  visibility: z.enum(["PRIVATE", "TEAM", "PUBLIC"]).default("TEAM"),
});

export type DocumentInput = z.infer<typeof documentSchema>;

// Intentionally 2000 — wider than the DB column (VarChar(1000) in schema.prisma).
// That mismatch is deliberate; see DEMO_BUG_SILENT_COMMENT_FAILURE in demo-bugs.ts.
export const commentSchema = z.object({
  body: z.string().min(1).max(2000),
});

export type CommentInput = z.infer<typeof commentSchema>;

export const membershipRoleSchema = z.object({
  role: z.enum(["ADMIN", "EDITOR", "GUEST"]),
});

export const ALLOWED_UPLOAD_MIME_TYPES = [
  "application/pdf",
  "image/png",
  "image/jpeg",
];

export const MAX_UPLOAD_BYTES = 10 * 1024 * 1024; // 10MB
