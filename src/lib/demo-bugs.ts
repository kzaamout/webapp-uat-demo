// Three deliberately-seeded, off-by-default demo bugs, gated in one place so the
// gating is auditable. Never enabled in normal usage — see README.md.
export type DemoBugName =
  | "permission-bypass"
  | "silent-comment-failure"
  | "a11y-missing-labels";

export function isDemoBugEnabled(name: DemoBugName): boolean {
  switch (name) {
    case "permission-bypass":
      return process.env.DEMO_BUG_PERMISSION_BYPASS === "1";
    case "silent-comment-failure":
      return process.env.DEMO_BUG_SILENT_COMMENT_FAILURE === "1";
    case "a11y-missing-labels":
      // NEXT_PUBLIC_ prefix required: this one needs to reach a client component.
      // The other two are server-only checks and stay unprefixed on purpose, so
      // they can never leak into the client bundle.
      return process.env.NEXT_PUBLIC_DEMO_BUG_A11Y_MISSING_LABELS === "1";
  }
}
