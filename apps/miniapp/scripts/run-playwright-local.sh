#!/usr/bin/env bash
set -euo pipefail

exec node scripts/run-playwright-local.mjs "$@"
