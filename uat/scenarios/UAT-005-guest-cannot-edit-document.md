# Scenario: A Guest cannot edit a document (read-only role, no bug involved)

- ID: UAT-005
- Related feature: <none — demo-app/specs/ doesn't exist yet>
- Priority: High
- Source: authored
- Viewports: <default — mobile 375px + desktop>

## User goal

Confirm the Guest role's read-only restriction actually holds — this is the app's
normal, always-on permission boundary, distinct from the deliberately-seeded
`DEMO_BUG_PERMISSION_BYPASS` scenario (see UAT-006).

## Preconditions

- App state: demo-app running with seed data loaded, all demo bug toggles OFF
  (the default)
- Existing data: at least one Acme Corp document
- Authentication: `guest@demo.local` / `Demo1234!` (GUEST on Acme Corp)
- Required test files: none

## Steps

1. Log in as `guest@demo.local`.
2. Open any existing document's detail page.
3. Confirm no "Edit" link/button is present in the UI.
4. Attempt to navigate directly to that document's `/edit` URL.
5. Attempt `PATCH /api/teams/{teamId}/documents/{id}` directly (e.g. via the
   browser's dev tools or an equivalent direct request) with a changed title.

## Expected outcome

- Step 3: no Edit affordance shown in the UI.
- Step 4: the edit page itself is not reachable (blocked, not just hidden from
  navigation).
- Step 5: the API call is rejected — the document's title is unchanged, confirmed
  via a direct Postgres read.

## Notes

This is the control case for UAT-006 — it should behave identically whether or not
any demo bug is enabled, since Guest-vs-Editor/Admin document permissions are not
one of the three seeded bug seams.
