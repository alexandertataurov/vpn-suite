#!/bin/sh
# Runs before the agent reads a file.
# Return exit code 1 to BLOCK the read entirely.
FILE=$(python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('file',''))" 2>/dev/null || echo "")

# Block reading sensitive files by extension
echo "$FILE" | grep -qE '\.(env|pem|key|p12|pfx|secret)$' && {
  echo "BLOCKED: Refusing to expose sensitive file: $FILE" >&2
  exit 1
}

# Block .env variants
echo "$FILE" | grep -qE '(^|/)\.env(\.|$)' && {
  echo "BLOCKED: .env file access denied." >&2
  exit 1
}

exit 0
