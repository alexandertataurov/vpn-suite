#!/bin/sh
# Runs before any shell command. Return exit code 1 to BLOCK the command.
# Receives JSON on stdin: { "command": "...", "conversation_id": "..." }
CMD=$(python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('command',''))" 2>/dev/null || echo "")

# Block irreversible destructive commands
echo "$CMD" | grep -qE '^\s*(rm\s+-rf\s+/|dd\s+if=|mkfs|fdisk|:(){ :|:&};:)' && {
  echo "BLOCKED: Dangerous command detected: $CMD" >&2
  exit 1
}

# Block pushing to main/master directly
echo "$CMD" | grep -qE 'git push.*origin.*(main|master)' && {
  echo "BLOCKED: Direct push to main/master is not allowed." >&2
  exit 1
}

exit 0
