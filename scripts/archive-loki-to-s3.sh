#!/usr/bin/env bash
# Archive Loki chunks to S3 before retention delete.
set -euo pipefail
IFS=$'\n\t'

command -v aws >/dev/null 2>&1 || { echo "missing aws cli" >&2; exit 1; }

BUCKET="${LOKI_ARCHIVE_S3_BUCKET:-}"
LOKI_DATA="${LOKI_DATA_PATH:-/tmp/loki}"

if [[ -z "$BUCKET" ]]; then
  echo "LOKI_ARCHIVE_S3_BUCKET not set. Skipping archive." >&2
  exit 0
fi

if [[ -z "$LOKI_DATA" || ! -d "$LOKI_DATA" ]]; then
  echo "LOKI_DATA_PATH missing. Expected Loki data dir at $LOKI_DATA" >&2
  exit 1
fi

CHUNKS="${LOKI_DATA}/chunks"
[[ -d "$CHUNKS" ]] || { echo "No chunks dir: $CHUNKS"; exit 1; }

aws s3 sync "$CHUNKS" "s3://${BUCKET}/loki-archive/chunks/" \
  --storage-class STANDARD_IA \
  --only-show-errors --no-progress --exact-timestamps || true
