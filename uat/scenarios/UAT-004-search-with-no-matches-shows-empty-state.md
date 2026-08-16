# Scenario: Searching for a nonexistent document shows a genuine empty state

- ID: UAT-004
- Related feature: <none — demo-app/specs/ doesn't exist yet>
- Priority: Medium
- Source: authored
- Viewports: <default — mobile 375px + desktop>

## User goal

A user searches the document list for something that doesn't exist, and needs to
clearly see "no results," not a blank screen or a stuck loading state.

## Preconditions

- App state: demo-app running with seed data loaded
- Existing data: Acme Corp's seeded documents (none titled anything like the query
  below)
- Authentication: `admin@demo.local` / `Demo1234!`
- Required test files: none

## Steps

1. Log in as `admin@demo.local`.
2. Navigate to Acme Corp → Documents.
3. Search for a title that matches nothing, e.g. `zzzznonexistentdoc`.

## Expected outcome

- A clear "No documents found" empty state is shown — not an error, not a blank
  page, not a stuck loading indicator.
- No literal `NaN`/`undefined`/`[object Object]` anywhere on the page.

## Notes

This is the app's one deliberately-real empty state — see
`demo-app/src/components/DocumentList.tsx`.
