#!/bin/sh
# Runs when the agent session stops.
# Cursor runs from workspace root; resolve .cursor/hooks/stop.sh -> repo root (two levels up).
case "$0" in */*) ROOT_DIR="$(cd "$(dirname "$0")/../.." && pwd)" ;; *) ROOT_DIR="$(pwd)" ;; esac
cd "$ROOT_DIR" || exit 0

LOG=".cursor/session.log"
mkdir -p .cursor
echo "$(date '+%Y-%m-%d %H:%M:%S') — Agent session ended" >> "$LOG"

TESTS_OK=0
if [ -d backend ] && command -v pytest >/dev/null; then
  (cd backend && pytest tests/ --cov=app --cov-report=term-missing -v) >> "$LOG" 2>&1 || TESTS_OK=1
fi
if [ -d frontend ] && command -v npm >/dev/null; then
  (cd frontend && npm test -- --run) >> "$LOG" 2>&1 || TESTS_OK=1
fi

if [ "$TESTS_OK" -eq 1 ]; then
  echo "Tests failed or skipped; not committing." >> "$LOG"
  command -v osascript >/dev/null && osascript -e 'display notification "Cursor Agent session complete." with title "Cursor"' 2>/dev/null
  exit 0
fi

if git diff --quiet && git diff --cached --quiet; then
  echo "No changes to commit." >> "$LOG"
else
  git add -A
  git commit -m "chore(cursor-agent): auto-commit on session stop [$(date +%Y%m%d-%H%M%S)]" >> "$LOG" 2>&1
fi

command -v osascript >/dev/null && osascript -e 'display notification "Cursor Agent session complete." with title "Cursor"' 2>/dev/null
exit 0
