# webapp-uat — Setup

One-time checklist to get `/webapp-uat` running against your app. For what the skill
actually does once it's running, see `README.md`; for full command syntax, `USAGE.md`.

## 1. Get the skill into your app's repo

**One-command path** (recommended), from inside your app's repo:

```
/plugin marketplace add kzaamout/claude-uat-skill
/plugin install webapp-uat@webapp-uat-marketplace
```

Installs `.claude/skills/webapp-uat/` for you. `scripts/dev.sh` and
`uat/scenarios/_template.md` still need to land in your repo's own tree (a plugin
install can only place files under `.claude/`) — step 2 below (`/webapp-uat setup`)
does that for you automatically, copying them from templates bundled inside the
installed skill.

**Manual alternative**, from this skill's source repo, copy into your app's repo root:

```
.claude/skills/webapp-uat/    (this whole folder)
uat/scenarios/_template.md
scripts/dev.sh
```

Either way, this has to happen before Claude Code can do anything else here —
`/webapp-uat` doesn't exist as a command until these files are in place.

## 2. Run the setup wizard

```
/webapp-uat setup
```

Inspects this repo (start/stop commands, port, whether Spec Kit is installed, a
`specs/` convention) and proposes `config.md`/`scripts/dev.sh` values instead of
making you hunt them down by hand — every value labeled detected / guessed / needs
your input, nothing written until you confirm. Full walkthrough with an example
transcript: `README.md`'s Installation & Setup section.

Expect to still fill in by hand, even after the wizard runs:

- [ ] `bug-assess-command` / `bug-fix-command` / `bug-test-command`, if
      `bug-fix-mechanism` came back `spec-kit` — the wizard surfaces
      `specify extension list`'s output but doesn't guess which entries are the right
      three.
- [ ] Anything the wizard flagged **needs your input** — an unrecognized start
      mechanism, an ambiguous repo root, etc.

If the wizard reports a write failure on one item (e.g. a permissions error creating
a directory), it's safe to just re-run `/webapp-uat setup` — already-written items
are left as-is, and only the outstanding ones are retried.

**Prefer not to use the wizard?** Skip to step 2b.

### 2b. Manual alternative

```bash
cp .claude/skills/webapp-uat/config.md.example .claude/skills/webapp-uat/config.md
```

Fill in `config.md` by hand — `project-name`, `project-dir`, `bug-fix-mechanism`,
`spec-dir` (optional), `review-before-fix` — then open `scripts/dev.sh` and fill in
`PROJECT_DIR`, `START_COMMAND`, `STOP_COMMAND`, `PORT` to match how your app actually
starts, stops, and reports itself ready. `WAIT_TIMEOUT` (default 30, roughly seconds)
is worth raising there for a slow-booting app — it's also overridable per-run via the
environment.

`SKILL.md`/`USAGE.md` themselves are never hand-edited either way — everything
project-specific lives in `config.md`.

## 3. Confirm `scripts/dev.sh` actually works

Whether it came from the wizard or by hand, test it once manually before trusting it:

```bash
scripts/dev.sh start
scripts/dev.sh wait-ready
scripts/dev.sh stop
```

`start` writes two files into your repo (`dev.log`, `.webapp-uat.pid`). Both must be
gitignored — Phase 0 requires a clean git working tree before every run, so leaving
them untracked-and-unignored blocks the very next run. The setup wizard (step 2)
checks and appends these `.gitignore` entries for you as part of its write step; if
you went the manual route (step 2b) instead, add them yourself.

## 4. Confirm Chrome is actually connected

```bash
claude --chrome
```

Then `/chrome` inside the session to verify it connects. Quit Claude Desktop first
if it's running on this machine — known native-messaging-host conflict with Claude
Code's Chrome bridge on macOS.

## 5. Write one real scenario

```bash
cp uat/scenarios/_template.md uat/scenarios/my-first-scenario.md
```

Fill it in. Drop anything it needs — a real, valid file, not a placeholder — into
`uat/fixtures/`.

## 6. Run it

```
/webapp-uat uat/scenarios/my-first-scenario.md
```

First run is slower than every run after it: Phase 0.5 inspects your app's codebase
once (routing, locale, test-data tooling, backend verification options — a different
pass than setup's discovery, run for different questions) and caches the result at
`.claude/skills/webapp-uat/discovered-environment.md`. Worth reading that file once
it's written, before trusting anything downstream of it — route-gap generation and
backend verification both build on what it found.

## Done when

- [ ] `/chrome` connects without error
- [ ] `config.md` exists and every required field is filled in (not the example file)
- [ ] `scripts/dev.sh start` / `wait-ready` / `stop` all work once, run manually
- [ ] At least one scenario exists in `uat/scenarios/` with its fixtures in place
- [ ] First `/webapp-uat` run completes and `discovered-environment.md` looks right
