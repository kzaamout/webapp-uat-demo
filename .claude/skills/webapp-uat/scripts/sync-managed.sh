#!/usr/bin/env bash
# sync-managed.sh -- keeps webapp-uat's managed files in a project up to date.
#
# A "managed file" is a file the skill owns but that has to live in the project's
# own tree (a plugin install can only place files under .claude/). Each carries a
# marker in its first three lines; the marker is the sole permission to overwrite.
# Project-owned files (scripts/dev.env, config.md, scenarios, fixtures, ...) are
# never touched by this script.
#
# Usage:
#   bash sync-managed.sh [<project-root>] --check          report per-file status; always exits 0
#   bash sync-managed.sh [<project-root>] --apply          copy in every differing/missing managed file
#   bash sync-managed.sh [<project-root>] --legacy-values  print dev.env lines from a pre-marker dev.sh
#                                                            (exit 3 if it isn't one, 2 if no START_COMMAND
#                                                            could be extracted)
#   bash sync-managed.sh --print <bundled path>              print a file bundled in the skill folder
#                                                            (USAGE.md, templates/dev.env.example, ...) -- for plugin
#                                                            installs the folder is outside the project, where
#                                                            the harness blocks direct reads; running this
#                                                            script is pre-authorized, so it reads on your behalf
#
# <project-root> defaults to `git rev-parse --show-toplevel` from the current
# directory, else the current directory. The skill folder is this script's parent.
# Bash 3.2 compatible. Full contract: the skill's source repo,
# specs/011-self-updating-managed-files/contracts/sync-managed-cli.md.

set -u

SKILL_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
MARKER='webapp-uat managed file'

# Managed table -- two index-aligned lists (no associative arrays in bash 3.2).
BUNDLED="templates/dev.sh templates/_template.md"
PROJECT="scripts/dev.sh uat/scenarios/_template.md"
VALUES_FILE="scripts/dev.env"
LEGACY_FILE="scripts/dev.sh"

usage() {
  echo "Usage: bash sync-managed.sh [<project-root>] --check | --apply | --legacy-values" >&2
  echo "       bash sync-managed.sh --print <bundled path>" >&2
  exit 2
}

MODE=""
ROOT=""
PRINT_PATH=""
while [ $# -gt 0 ]; do
  case "$1" in
    --check|--apply|--legacy-values) MODE="$1" ;;
    --print) MODE="$1"; shift; PRINT_PATH="${1:-}" ;;
    -*) usage ;;
    *) ROOT="$1" ;;
  esac
  shift
done
[ -n "$MODE" ] || usage

if [ "$MODE" = "--print" ]; then
  case "$PRINT_PATH" in
    ""|/*|*..*) usage ;;
  esac
  if [ ! -f "$SKILL_DIR/$PRINT_PATH" ]; then
    echo "sync-managed: no bundled file $PRINT_PATH in $SKILL_DIR" >&2
    exit 2
  fi
  exec cat "$SKILL_DIR/$PRINT_PATH"
fi

if [ -z "$ROOT" ]; then
  ROOT="$(git rev-parse --show-toplevel 2>/dev/null || pwd)"
fi

cannot() { # <reason> -- --check must never fail the skill invocation
  if [ "$MODE" = "--check" ]; then
    echo "managed-files: cannot check ($1)"
    exit 0
  fi
  echo "sync-managed: $1" >&2
  exit 2
}

[ -d "$ROOT" ] || cannot "project root not found: $ROOT"
ROOT="$(cd "$ROOT" && pwd)"
for b in $BUNDLED; do
  [ -f "$SKILL_DIR/$b" ] || cannot "bundled file missing: $SKILL_DIR/$b"
done

has_marker() { head -3 "$1" 2>/dev/null | grep -q "$MARKER"; }

is_legacy() { # <project-relative path>
  [ "$1" = "$LEGACY_FILE" ] || return 1
  [ -f "$ROOT/$1" ] || return 1
  has_marker "$ROOT/$1" && return 1
  grep -q '^START_COMMAND=' "$ROOT/$1" && grep -q '^PORT=' "$ROOT/$1"
}

status_of() { # <project-relative path> <bundled absolute path>
  local p="$ROOT/$1"
  if [ ! -f "$p" ]; then
    echo missing
  elif has_marker "$p"; then
    if cmp -s "$2" "$p"; then echo in-sync; else echo update-available; fi
  elif is_legacy "$1"; then
    echo legacy
  else
    echo unmanaged
  fi
}

values_line() {
  if [ -f "$ROOT/$VALUES_FILE" ]; then
    printf '%-18s%s  present\n' values-file "$VALUES_FILE"
  else
    printf '%-18s%s  missing\n' values-file "$VALUES_FILE"
  fi
}

# Walk the two lists in lockstep.
set -- $PROJECT
CHANGED=0
CHANGED_PATHS=""
RC=0
for b in $BUNDLED; do
  rel="$1"; shift
  src="$SKILL_DIR/$b"
  dst="$ROOT/$rel"
  st="$(status_of "$rel" "$src")"
  case "$MODE" in
    --check)
      printf '%-18s%s\n' "$st" "$rel"
      ;;
    --apply)
      case "$st" in
        update-available|missing)
          if mkdir -p "$(dirname "$dst")" && cp "$src" "$dst"; then
            if [ -x "$src" ]; then chmod +x "$dst"; fi
            if [ "$st" = missing ]; then printf '%-18s%s\n' created "$rel"; else printf '%-18s%s\n' updated "$rel"; fi
            CHANGED=$((CHANGED+1))
            CHANGED_PATHS="${CHANGED_PATHS:+$CHANGED_PATHS }$rel"
          else
            echo "sync-managed: failed to copy $src -> $dst" >&2
            printf '%-18s%s\n' failed "$rel"
            RC=2
          fi
          ;;
        in-sync)   printf '%-18s%s\n' in-sync "$rel" ;;
        unmanaged) printf '%-18s%s\n' skipped-unmanaged "$rel" ;;
        legacy)    printf '%-18s%s\n' skipped-legacy "$rel" ;;
      esac
      ;;
    --legacy-values)
      : # handled below
      ;;
  esac
done

case "$MODE" in
  --check)
    values_line
    exit 0
    ;;
  --apply)
    values_line
    echo "changed: $CHANGED"
    echo "changed-paths: $CHANGED_PATHS"
    exit "$RC"
    ;;
  --legacy-values)
    if ! is_legacy "$LEGACY_FILE"; then
      echo "not-legacy"
      exit 3
    fi
    # PROJECT_DIR is sourced too (never printed) so a value that references it still
    # expands to the legacy file's absolute path instead of tripping `set -u`.
    lines="$(grep -E '^(PROJECT_DIR|START_COMMAND|STOP_COMMAND|PORT|WAIT_TIMEOUT)=' "$ROOT/$LEGACY_FILE")"
    out="$(
      set +u
      unset PROJECT_DIR START_COMMAND STOP_COMMAND PORT WAIT_TIMEOUT
      eval "$lines" 2>/dev/null
      q="'\\''"
      for k in START_COMMAND STOP_COMMAND PORT WAIT_TIMEOUT; do
        eval "v=\${$k:-}"
        [ -n "$v" ] || continue
        printf "%s='%s'\n" "$k" "${v//\'/$q}"
      done
    )"
    case "$out" in
      START_COMMAND=*) printf '%s\n' "$out"; exit 0 ;;
      *)
        echo "sync-managed: could not extract START_COMMAND from $LEGACY_FILE -- fill scripts/dev.env in by hand" >&2
        exit 2
        ;;
    esac
    ;;
esac
