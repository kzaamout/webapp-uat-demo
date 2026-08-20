# Scenario: <Name>

- ID: UAT-001
- Related feature: <path to the spec this scenario tests against, under `config.md`'s
  `spec-dir` — also what Phase 2's UI-conformance check reads to know what's actually
  required. Leave blank if this project has no `spec-dir` configured.>
- Priority: Critical | High | Medium | Low
- Source: authored | spec-derived | boundary-derived | route-gap-derived | review-derived
- Viewports: <optional — default is mobile 375px + desktop if omitted; list specific
  breakpoints here only if this flow needs more than the default>

## User goal

What the end user is trying to accomplish.

## Preconditions

- App state
- Existing data
- Authentication: which account this scenario logs in as (a fixed test account from
  seed data — re-established explicitly at the start of this scenario, not assumed
  from whatever ran before it)
- Required test files: exact path under `uat/fixtures/`, plus any constraint that
  matters, e.g. `uat/fixtures/sample-oversized.pdf — valid PDF, >10MB` — not a
  description, an actual checked-in file with its real requirement noted

## Steps

1. ...
2. ...
3. ...

## Expected outcome

- Observable final result
- Required confirmation or feedback
- Data that should be created or changed — this gets verified directly against the
  backend (DB/vector store or API), not just inferred from what the UI shows

## Notes

Areas where exploratory testing is especially welcome — don't over-script every click.
