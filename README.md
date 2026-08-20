# Team Documents — a `webapp-uat` demo

A small internal document-library app, built specifically to exercise every core
capability of the [`webapp-uat`](https://github.com/kzaamout/claude-uat-skill)
Claude Code skill — not a real
product. This repo is deliberately self-contained: the skill is already installed at
`.claude/skills/webapp-uat/`, already configured (`config.md`), and already has a
starter set of real scenarios in `uat/scenarios/`. Clone it, run it, and you can
start exercising `webapp-uat` in minutes.

If you're reading this from the skill's own source repo
(`claude-uat-skill`), this is that project's `demo-app/` submodule — kept as an
independent repo specifically so `webapp-uat`'s own root detection resolves
correctly here, the same way it would in any real installation.

---

## Setup

**Prerequisites**: Node 20+, Docker, and Claude Code with Chrome connected (`/chrome`)
if you intend to actually run scenarios rather than just read this guide.

```bash
npm install
./run.sh
```

`run.sh` brings up Postgres (Docker Compose, port **5433** — deliberately not 5432,
to avoid colliding with anything else you might have running locally), applies
migrations, seeds demo data, and starts the dev server on **http://localhost:3000**.
First run pulls the `postgres:16-alpine` image, which can take a few minutes
depending on your network — that's normal, not a hang.

Stop everything with `docker compose down` — exactly what `scripts/dev.sh stop` does.

**Confirm the wiring once, by hand, before trusting `webapp-uat` to rely on it**:

```bash
scripts/dev.sh start
scripts/dev.sh wait-ready
scripts/dev.sh stop
```

## Seeded accounts

All passwords: `Demo1234!`

| Email | Team | Role |
|---|---|---|
| `admin@demo.local` | Acme Corp | ADMIN |
| `editor@demo.local` | Acme Corp | EDITOR |
| `guest@demo.local` | Acme Corp | GUEST (read-only) |
| `globex-admin@demo.local` | Globex | ADMIN |

Globex exists purely as a cross-tenant isolation control — an Acme member should
never be able to reach a Globex document, with or without any demo bug enabled.

## What this app is built to exercise

- **Multi-role auth with a real permission boundary** — three roles, one team, plus
  a second team to prove cross-tenant isolation holds independently of role.
- **A substantively validated form** — document title/body/tags all have real,
  server-enforced zod rules (`src/lib/validation.ts`), not just client-side hints.
- **File upload with real accept/reject rules** — mime-type allowlist and a 10MB
  size cap, enforced server-side (`src/lib/upload.ts`), stored outside `public/` and
  served only through an authorized download route.
- **A queryable relational schema** — 6 Prisma models, real relationships, enough
  for genuine backend verification (not a single-table toy).
- **A genuine list-view empty state** — the documents list's search/filter can
  produce zero results for real.
- **File-based routing with an intentional coverage gap** — `/profile` and the
  team settings landing page are deliberately left out of the bundled example
  scenarios in `uat/scenarios/`, so `webapp-uat generate`'s route-gap-derived
  source has something real to find on a first run.
- **Both of `webapp-uat`'s backend-verification paths** — document counts are
  readable through this app's own API; comments are POST-only (no GET), forcing
  verification through a direct Postgres read instead.

---

## Testing `webapp-uat` against this app

Everything below assumes you're running Claude Code **from this repo's root**
(so `/webapp-uat` resolves to the copy installed here) with the app already running
(`./run.sh`) unless a step says otherwise. Each entry gives the exact steps, what to
expect, and *why* that's the correct behavior — not just what happens, but what
capability of the skill it's actually proving.

### 1. `/webapp-uat setup`

**Steps**: run it against this repo (safe to re-run — `config.md` already exists, so
this exercises the re-run/comparison path, not first-time setup).

**Expected outcome**: start/stop are **detected** (`run.sh` + `docker-compose.yml`
at this repo's root — the top tier of the most-specific-evidence rule), port is
**detected** or **guessed** `3000`, `bug-fix-mechanism` proposes `direct` (no
`.specify/` here), `spec-dir` stays unset (no `specs/` here). Current `config.md`
values are shown next to these proposals, per field.

**Why**: this app was built with a root-level `run.sh`+`docker-compose.yml` pairing
specifically to match this detection rule — and critically, this only resolves
correctly because this repo has its **own** git root. In `webapp-uat`'s source repo,
this same detection ran against the wrong root entirely (the skill's own repo, not
this app's) and came back empty. That mismatch — and the fix — is the whole reason
this repo exists as its own independent submodule rather than a subdirectory.

### 2. Run one scenario: `/webapp-uat uat/scenarios/UAT-001-admin-views-team-documents.md`

**Steps**: run it as shown, with the app already running.

**Expected outcome**: a test plan is written and approved, the scenario executes in
a real, visible Chrome window, logs in as `admin@demo.local`, browses to the
documents list, and the run completes clean — a final report is written showing one
scenario passed.

**Why**: this is the core value loop with nothing else layered on — approve a
scenario, watch it run in a real browser, get a written outcome. Every other entry
in this guide builds on this one working first.

### 3. Run the whole bundled set: `/webapp-uat`

**Steps**: run with no arguments (defaults to `uat/scenarios/`).

**Expected outcome**: all 6 scenarios (`UAT-001`–`UAT-006`) run in sequence, each
logging in explicitly as its own stated account (not assuming the previous
scenario's session), each getting a real accessibility audit and data-integrity
check. All should pass clean with every demo bug off (the default).

**Why**: proves scenario-to-scenario isolation (explicit re-login every time) and
that the expanded per-scenario checks (axe-core, data-integrity) run against a real,
intentionally-clean baseline — worth doing once before deliberately breaking
anything with a demo bug.

### 4. `/webapp-uat generate`

**Steps**: run generation mode against this repo.

**Expected outcome**: spec-derived and boundary-derived sources are **skipped**,
explicitly noted (no `specs/` directory here yet). Route-gap-derived still runs and
finds `/profile` and `/teams/[teamId]/settings` (the team settings landing
page) — two routes deliberately left out of the bundled `uat/scenarios/` set.

**Why**: demonstrates two things at once — a generation source degrading honestly
when its prerequisite is missing (rather than silently no-op'ing without saying so),
and route-gap-derived generation actually finding a real, deliberately-planted gap
rather than a contrived one.

### 5. Accessibility bug: `NEXT_PUBLIC_DEMO_BUG_A11Y_MISSING_LABELS`

**Steps**:
```bash
scripts/dev.sh stop
echo "NEXT_PUBLIC_DEMO_BUG_A11Y_MISSING_LABELS=1" >> .env
scripts/dev.sh start && scripts/dev.sh wait-ready
```
Then run `/webapp-uat uat/scenarios/UAT-002-editor-creates-document-with-attachment.md`
(the scenario that visits the document-creation form this bug lives on).

**Expected outcome**: the accessibility audit finds a real `label`/`image-alt`
violation on the upload form — a genuine `axe-core` finding, not a visual guess —
classified as a `BUG`.

**Why**: proves the accessibility check is a real, tool-driven audit
(`results.violations` from an injected `axe-core` run), not model visual
inspection — this is the one seeded issue placed specifically so it's unambiguous
which check caught it.

**Reset**: `scripts/dev.sh stop`, remove the line from `.env`, `scripts/dev.sh start`.

### 6. Permission-bypass bug: `DEMO_BUG_PERMISSION_BYPASS` — the high-risk stop-and-ask

**Steps** (run twice — once as the control, once with the bug on):

*Control (bug off, the default)* — run
`/webapp-uat uat/scenarios/UAT-006-editor-denied-direct-url-to-members.md` as-is.
Expect it to pass clean: the editor is genuinely denied.

*With the bug on*:
```bash
scripts/dev.sh stop
echo "DEMO_BUG_PERMISSION_BYPASS=1" >> .env
scripts/dev.sh start && scripts/dev.sh wait-ready
```
Run the same scenario again.

**Expected outcome**: this time the editor *can* reach `/settings/members` and
change a role — a real permission-boundary failure. Classified `BUG`, high severity.
Because this touches auth/access-control, Phase 4 **must** pause for explicit
sign-off before attempting any fix — regardless of `--silent` or
`--no-review-before-fix`.

**Why**: this is the sharpest demonstration in the whole app of `webapp-uat`'s
mandatory high-risk stop-and-ask. If you only test one demo bug, make it this one —
confirm the pause actually happens, on every flag combination you're willing to try.

**Reset**: same as above, remove the line from `.env`, restart.

### 7. Silent backend-write failure: `DEMO_BUG_SILENT_COMMENT_FAILURE` — backend verification

**Steps**: this needs a scenario step that posts a comment between 1001–2000
characters (past the DB column's real limit, within the app's validated max — see
`src/lib/validation.ts` vs. `prisma/schema.prisma`). Add this as a step to a copy of
`UAT-002`, or use `/webapp-uat generate` (boundary-derived) once `specs/` exists.
Then:
```bash
scripts/dev.sh stop
echo "DEMO_BUG_SILENT_COMMENT_FAILURE=1" >> .env
scripts/dev.sh start && scripts/dev.sh wait-ready
```
Run the scenario.

**Expected outcome**: the UI shows "Comment added" — but Phase 2's backend
verification (a **direct Postgres read**, since comments are POST-only with no GET
endpoint) finds the comment was never actually written. Classified `BUG`.

**Why**: this is the one seam in the whole app that specifically proves backend
verification catches what a UI-only check structurally cannot — the API response
itself claims success. It also exercises the direct-database-read verification path
specifically (as opposed to the API-covered path `UAT-002`'s document creation
uses), since comments have no read endpoint at all.

**Reset**: same pattern — remove the line, restart.

### 8. `--silent` mode

**Steps**: `/webapp-uat --silent` with the permission-bypass bug still enabled from
step 6 (don't reset it first).

**Expected outcome**: Phase 1's plan approval and the per-bug review pause are
skipped automatically — but the high-risk stop-and-ask for the permission-bypass
finding **still fires and still blocks**, exactly as under normal mode.

**Why**: proves the "never skipped by `--silent`" safety set is real, not just
documented — this is the adversarial case where it would matter most.

**Reset**: turn off `DEMO_BUG_PERMISSION_BYPASS` and restart before moving on.

### 9. Fixture auto-synthesis

**Steps**: write (or generate) a scenario whose Preconditions reference
`uat/fixtures/sample-oversized.pdf` — deliberately **not** checked into this repo.
Run it.

**Expected outcome**: Phase 0 notices the fixture is missing and offers to
synthesize it — a genuinely valid PDF that's actually over the 10MB size limit
(`MAX_UPLOAD_BYTES` in `src/lib/validation.ts`), not a placeholder file with the
right extension.

**Why**: `sample-small.pdf` and `sample-corrupted.pdf` are checked in and ready to
use; `sample-oversized.pdf` is missing on purpose so this synthesis flow gets
exercised live at least once, rather than only ever running against a fully
pre-staged fixture set.

---

## The three seeded demo bugs — quick reference

All **off by default**. Toggling any of them requires a restart (env vars are read
at process start) — budget that cost into a demo, same as `webapp-uat`'s own Phase 4
already pays around every real bug fix.

| Bug | Env var | What it does | What it proves |
|---|---|---|---|
| Permission bypass | `DEMO_BUG_PERMISSION_BYPASS` | Skips the role check on the members page + API | The high-risk stop-and-ask (§6) |
| Accessibility | `NEXT_PUBLIC_DEMO_BUG_A11Y_MISSING_LABELS` | Drops a label + alt text on the upload form | Real `axe-core` auditing, not visual guessing (§5) |
| Silent comment failure | `DEMO_BUG_SILENT_COMMENT_FAILURE` | Swallows a real DB error, reports success anyway | Backend verification via direct DB read (§7) |

**Not affected by any toggle**: cross-tenant isolation (an Acme member reaching a
Globex document) — that check is separate and always enforced, so the app's reports
show one boundary that always holds next to ones seeded to fail, not every finding
looking like a planted bug.

## Tests

```bash
npm test
```

A thin Vitest suite on `src/lib/validation.ts` and `src/lib/auth.ts` — deliberately
not a Playwright/E2E suite, since that would just duplicate what `webapp-uat` itself
is for.

## What's deliberately not here yet

Spec Kit specs under `specs/` — needed for `webapp-uat generate`'s spec-derived
source and the UI-conformance check (§4 shows the honest no-op without them). A
planned follow-up once this app itself is validated working, not built in this pass.
