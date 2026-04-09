#!/bin/sh
set -eu

# Prometheus multiprocess mode: ensure a clean metrics dir on start.
if [ -n "${PROMETHEUS_MULTIPROC_DIR:-}" ]; then
  mkdir -p "$PROMETHEUS_MULTIPROC_DIR"
  rm -f "$PROMETHEUS_MULTIPROC_DIR"/*.db 2>/dev/null || true
fi

exec uvicorn app.main:app --host 0.0.0.0 --port 8000 --workers "${WEB_CONCURRENCY:-2}" --no-access-log
