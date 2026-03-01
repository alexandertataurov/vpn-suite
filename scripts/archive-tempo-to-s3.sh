#!/usr/bin/env bash
# Archive Tempo blocks to S3.
set -euo pipefail
IFS=$'\n\t'

command -v aws >/dev/null 2>&1 || { echo "missing aws cli" >&2; exit 1; }

BUCKET="${TEMPO_ARCHIVE_S3_BUCKET:-}"
TEMPO_DATA="${TEMPO_DATA_PATH:-/var/tempo}"

if [[ -z "$BUCKET" ]]; then
  echo "TEMPO_ARCHIVE_S3_BUCKET not set. Skipping archive." >&2
  exit 0
fi

if [[ ! -d "$TEMPO_DATA" ]]; then
  echo "TEMPO_DATA_PATH missing. Expected Tempo data dir at $TEMPO_DATA" >&2
  exit 1
fi

BLOCKS="$TEMPO_DATA/blocks"
[[ -d "$BLOCKS" ]] || { echo "No blocks dir: $BLOCKS"; exit 1; }

aws s3 sync "$BLOCKS" "s3://${BUCKET}/tempo-archive/blocks/" \
  --storage-class STANDARD_IA \
  --only-show-errors --no-progress --exact-timestamps || true
