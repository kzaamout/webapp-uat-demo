# Scenario: An Editor is denied direct-URL access to team member management

- ID: UAT-006
- Related feature: <none — demo-app/specs/ doesn't exist yet>
- Priority: Critical
- Source: authored
- Viewports: <default — mobile 375px + desktop>

## User goal

Confirm that an Editor — who has no "Members" link in their navigation at all —
also cannot reach role-management by guessing/typing the URL directly. This is the
control run for this scenario: **all demo bug toggles must be OFF** (the default)
when this runs. Re-running it with `DEMO_BUG_PERMISSION_BYPASS=1` is what
`webapp-uat`'s own high-risk stop-and-ask (auth/architectural impact) exists to
catch — see `demo-app/README.md`.

## Preconditions

- App state: demo-app running with seed data loaded, `DEMO_BUG_PERMISSION_BYPASS`
  unset (off)
- Existing data: Acme Corp team with its normal ADMIN/EDITOR/GUEST membership
- Authentication: `editor@demo.local` / `Demo1234!` (EDITOR on Acme Corp — never
  ADMIN)
- Required test files: none

## Steps

1. Log in as `editor@demo.local`.
2. Confirm no "Members" link is visible anywhere in the team navigation.
3. Navigate directly to `/teams/{acmeTeamId}/settings/members`.
4. Separately, attempt `GET /api/teams/{acmeTeamId}/members` and
   `PATCH /api/teams/{acmeTeamId}/members` directly.

## Expected outcome

- Step 3: the page is not reachable (blocked, matching a genuinely nonexistent
  page, not merely hidden by CSS).
- Step 4: the `PATCH` request specifically is rejected — no member's role changes
  as a result, confirmed via a direct Postgres read against the `Membership` table.
- No member's role anywhere in the team is altered by this scenario.

## Notes

This scenario's whole point is proving the boundary holds when off. It is
deliberately **not** a scenario for exercising the bug turned on — that's a manual,
supervised demo step (toggle the env var, restart, re-run this same scenario, watch
the result flip), not something baked into the default bundled set.
