# Scenario: A too-short document title is rejected, not silently truncated

- ID: UAT-003
- Related feature: <none — demo-app/specs/ doesn't exist yet>
- Priority: High
- Source: boundary-derived
- Viewports: <default — mobile 375px + desktop>

## User goal

N/A directly — this is a boundary/negative-path case derived from the actual
validation rule in `demo-app/src/lib/validation.ts` (`documentSchema.title`:
minimum 3 characters), not a real user goal.

## Preconditions

- App state: demo-app running with seed data loaded
- Existing data: Acme Corp team exists
- Authentication: `editor@demo.local` / `Demo1234!` (EDITOR on Acme Corp)
- Required test files: none

## Steps

1. Log in as `editor@demo.local`.
2. Navigate to Acme Corp → Documents → "New document".
3. Enter a 2-character title (e.g. "ab") and a valid body.
4. Submit.

## Expected outcome

- The submission is rejected with a specific, readable validation error — not a
  generic failure, and not a silently-truncated/auto-corrected title.
- No document is created — confirm via a direct Postgres read that no new row with
  that title exists.

## Notes

Server-side enforcement matters here more than client-side: this scenario is really
checking that `POST /api/teams/:teamId/documents` itself rejects the payload, not
just that the browser's own form validation happens to catch it first.
