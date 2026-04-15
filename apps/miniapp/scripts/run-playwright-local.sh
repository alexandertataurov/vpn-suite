#!/usr/bin/env bash
set -euo pipefail

# Local fallback for environments where Playwright Chromium misses shared libs.
PW_LIB_DIR="${HOME}/.local/pwlibs/usr/lib/x86_64-linux-gnu"

if [[ -d "${PW_LIB_DIR}" ]]; then
  if [[ -n "${LD_LIBRARY_PATH:-}" ]]; then
    export LD_LIBRARY_PATH="${PW_LIB_DIR}:${LD_LIBRARY_PATH}"
  else
    export LD_LIBRARY_PATH="${PW_LIB_DIR}"
  fi
fi

exec pnpm exec playwright "$@"
