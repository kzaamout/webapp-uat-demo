# Scenario: Editor creates a document with a valid attachment

- ID: UAT-002
- Related feature: <none — demo-app/specs/ doesn't exist yet>
- Priority: Critical
- Source: authored
- Viewports: <default — mobile 375px + desktop>

## User goal

An editor wants to add a new document to the team library, including a supporting
file.

## Preconditions

- App state: demo-app running with seed data loaded
- Existing data: Acme Corp team exists
- Authentication: `editor@demo.local` / `Demo1234!` (EDITOR on Acme Corp)
- Required test files: `uat/fixtures/sample-small.pdf` — valid PDF, <1MB

## Steps

1. Log in as `editor@demo.local`.
2. Navigate to Acme Corp → Documents → "New document".
3. Fill in a title (≥3 characters), a body (≥10 characters), one or two tags, and
   leave visibility as the default (Team).
4. Attach `uat/fixtures/sample-small.pdf`.
5. Submit.

## Expected outcome

- Redirected to the new document's detail page.
- The document's title/body/tags/visibility match what was entered.
- The attachment appears on the detail page and its download link works.
- Backend verification: the new row exists in the `Document` table (and a matching
  row in `Attachment`) via a direct Postgres read — the app's own API only exposes
  document reads scoped to a team, so this is the API-covered verification path.

## Notes

This is the app's core "create" happy path — a good baseline before layering any
of the seeded demo bugs on top.
