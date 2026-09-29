#!/usr/bin/env bash
# webapp-uat managed file -- do not edit; overwritten on skill update; remove this line to take ownership
#
# Start / stop / wait-ready for the app under test. Everything project-specific lives
# in scripts/dev.env next to this file (written by `/webapp-uat setup`, committed with
# your repo); this script holds none of it, which is what lets webapp-uat replace it
# wholesale when the skill updates.
#
#   scripts/dev.sh start        bring the app up in the background (output -> dev.log)
#   scripts/dev.sh wait-ready   poll until it answers, or give up after WAIT_TIMEOUT
#   scripts/dev.sh stop         shut it down
#
# dev.env keys: START_COMMAND (required), STOP_COMMAND, PORT (required unless
# READY_COMMAND is set), WAIT_TIMEOUT (default 30; a per-run env var wins),
# READY_COMMAND. Each is documented in scripts/dev.env.example.

set -u

PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
DEV_ENV="$PROJECT_DIR/scripts/dev.env"
ENV_WAIT_TIMEOUT="${WAIT_TIMEOUT:-}"   # per-run override, captured before dev.env loads

if [ ! -f "$DEV_ENV" ]; then
  echo "scripts/dev.env not found -- run /webapp-uat setup"
  exit 1
fi
# shellcheck disable=SC1090
. "$DEV_ENV"

if [ -z "${START_COMMAND:-}" ]; then
  echo "START_COMMAND is not set in scripts/dev.env -- run /webapp-uat setup"
  exit 1
fi
if [ -z "${PORT:-}" ] && [ -z "${READY_COMMAND:-}" ]; then
  echo "PORT (or READY_COMMAND) is not set in scripts/dev.env -- run /webapp-uat setup"
  exit 1
fi
WAIT_TIMEOUT="${ENV_WAIT_TIMEOUT:-${WAIT_TIMEOUT:-30}}"
STOP_COMMAND="${STOP_COMMAND:-}"
READY_COMMAND="${READY_COMMAND:-}"
PORT="${PORT:-}"

PIDFILE="$PROJECT_DIR/.webapp-uat.pid"

# signal_group <SIG> <pid> -- the start job runs in its own process group (see
# `start`), so one signal reaches every descendant, not just the direct children.
# The per-pid and per-parent sends are belt-and-braces for a pidfile written by
# an older engine.
signal_group() {
  kill "-$1" -- "-$2" 2>/dev/null
  kill "-$1" "$2" 2>/dev/null
  pkill "-$1" -P "$2" 2>/dev/null
}

case "${1:-}" in
  start)
    if [ -f "$PIDFILE" ] && kill -0 "$(cat "$PIDFILE")" 2>/dev/null; then
      echo "Already running (pid $(cat "$PIDFILE"))"
      exit 0
    fi
    cd "$PROJECT_DIR" || exit 1
    # Run START_COMMAND through a shell, so `&&`, pipes, env prefixes and quoting all
    # work. Job control (set -m) puts the job in its own process group, which is what
    # lets `stop` signal every descendant at once and is why SIGINT is not ignored by
    # the backgrounded job (a background job started without job control ignores it).
    set -m
    nohup bash -c "$START_COMMAND" > dev.log 2>&1 &
    PID=$!
    set +m
    echo "$PID" > "$PIDFILE"
    echo "Started (pid $PID)"
    ;;
  stop)
    if [ -f "$PIDFILE" ]; then
      PID="$(cat "$PIDFILE")"
      # Ctrl+C equivalent first -- SIGINT is what an interactive terminal sends.
      signal_group INT "$PID"
      sleep 2
      # Escalate only if the job is still there: SIGTERM, then SIGKILL as the last resort.
      if kill -0 "$PID" 2>/dev/null; then
        signal_group TERM "$PID"
        sleep 1
        if kill -0 "$PID" 2>/dev/null; then
          signal_group KILL "$PID"
        fi
      fi
      rm -f "$PIDFILE"
    fi
    if [ -n "$STOP_COMMAND" ]; then
      ( cd "$PROJECT_DIR" && eval "$STOP_COMMAND" )
    fi
    echo "Stopped"
    ;;
  wait-ready)
    for _ in $(seq 1 "$WAIT_TIMEOUT"); do
      if [ -n "$READY_COMMAND" ]; then
        if ( cd "$PROJECT_DIR" && eval "$READY_COMMAND" ) > /dev/null 2>&1; then
          echo "Ready"
          exit 0
        fi
      elif curl -sf "http://localhost:$PORT" > /dev/null; then
        echo "Ready"
        exit 0
      fi
      sleep 1
    done
    if [ -n "$READY_COMMAND" ]; then
      echo "Timed out after ~${WAIT_TIMEOUT}s waiting for READY_COMMAND to succeed"
    else
      echo "Timed out after ~${WAIT_TIMEOUT}s waiting for localhost:$PORT"
    fi
    exit 1
    ;;
  *)
    echo "Usage: $0 {start|stop|wait-ready}"
    exit 1
    ;;
esac
