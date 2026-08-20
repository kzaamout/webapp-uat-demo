#!/usr/bin/env bash
# Start/stop/wait-ready for the app under test. Fill in the four values below for
# your project, then confirm each of start/stop/wait-ready works once, run manually,
# before trusting webapp-uat to rely on it.
#
# This script's mechanism (edit-by-hand, one command each for start/stop) is a known
# rough edge — see the project's docs/design-history.md for where this is headed.

set -u

PROJECT_DIR="/path/to/your/app"     # absolute path to the app's repo root
START_COMMAND="./run.sh"            # brings up everything the app needs (backend, db, etc.)
STOP_COMMAND="docker compose down"  # anything START_COMMAND doesn't tear down via SIGINT
PORT=3000                           # what the app serves its health check on

PIDFILE="$PROJECT_DIR/.webapp-uat.pid"

case "${1:-}" in
  start)
    if [ -f "$PIDFILE" ] && kill -0 "$(cat "$PIDFILE")" 2>/dev/null; then
      echo "Already running (pid $(cat "$PIDFILE"))"
      exit 0
    fi
    cd "$PROJECT_DIR" || exit 1
    nohup $START_COMMAND > dev.log 2>&1 &
    echo $! > "$PIDFILE"
    echo "Started (pid $!)"
    ;;
  stop)
    if [ -f "$PIDFILE" ]; then
      PID="$(cat "$PIDFILE")"
      # Ctrl+C equivalent — SIGINT is what an interactive terminal sends.
      kill -INT "$PID" 2>/dev/null
      sleep 2
      # If START_COMMAND didn't forward SIGINT to its own children, this catches them.
      pkill -INT -P "$PID" 2>/dev/null
      rm -f "$PIDFILE"
    fi
    ( cd "$PROJECT_DIR" && eval "$STOP_COMMAND" )
    echo "Stopped"
    ;;
  wait-ready)
    for i in $(seq 1 30); do
      if curl -sf "http://localhost:$PORT" > /dev/null; then
        echo "Ready"
        exit 0
      fi
      sleep 1
    done
    echo "Timed out waiting for localhost:$PORT"
    exit 1
    ;;
  *)
    echo "Usage: $0 {start|stop|wait-ready}"
    exit 1
    ;;
esac
