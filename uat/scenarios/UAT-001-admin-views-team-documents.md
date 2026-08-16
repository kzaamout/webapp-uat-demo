# Scenario: Admin logs in and views the team documents list

- ID: UAT-001
- Related feature: <none — demo-app/specs/ doesn't exist yet>
- Priority: Critical
- Source: authored
- Viewports: <default — mobile 375px + desktop>

## User goal

An admin wants to log in and see the list of documents already in their team's
library.

## Preconditions

- App state: demo-app running with seed data loaded (Acme Corp team, seeded via
  `prisma/seed.ts`)
- Existing data: Acme Corp has ~12 seeded documents across visibility levels
- Authentication: `admin@demo.local` / `Demo1234!` (ADMIN on Acme Corp)
- Required test files: none

## Steps

1. Navigate to the app root; expect a redirect to `/login`.
2. Log in as `admin@demo.local`.
3. From `/teams`, open Acme Corp.
4. From the team dashboard, click "Browse documents".

## Expected outcome

- The documents list shows multiple seeded documents, most-recent first.
- Each row shows title, author, visibility, and tags.
- No console errors during the flow.

## Notes

Good candidate for confirming the accessibility audit and data-integrity check run
cleanly against the baseline (unmodified, all demo bugs off) app.
