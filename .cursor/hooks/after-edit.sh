#!/bin/sh
# Runs after the agent edits any file.
# Receives JSON on stdin: { "file": "...", "conversation_id": "..." }
FILE=$(python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('file',''))" 2>/dev/null || echo "")
[ -z "$FILE" ] && exit 0

EXT="${FILE##*.}"
case "$EXT" in
  js|ts|jsx|tsx|json)
    command -v npx >/dev/null && npx eslint --fix "$FILE" 2>/dev/null
    ;;
  py)
    command -v ruff >/dev/null && ruff format "$FILE" 2>/dev/null
    command -v ruff >/dev/null && ruff check --fix "$FILE" 2>/dev/null
    ;;
esac
exit 0
