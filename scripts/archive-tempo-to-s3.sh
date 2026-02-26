#!/usr/bin/env bash
# Archive Tempo blocks to S3.
# Requires: AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, TEMPO_ARCHIVE_S3_BUCKET
# Intended to run in a container with tempo_data mounted at /var/tempo.
# See docs/observability/archive-pipeline.md
set -e

BUCKET="${TEMPO_ARCHIVE_S3_BUCKET:-}"
TEMPO_DATA="${TEMPO_DATA_PATH:-/var/tempo}"

if [ -z "$BUCKET" ]; then
  echo "TEMPO_ARCHIVE_S3_BUCKET not set. Skipping archive." >&2
  exit 0
fi

if [ ! -d "$TEMPO_DATA" ]; then
  echo "TEMPO_DATA_PATH missing. Expected Tempo data dir at $TEMPO_DATA" >&2
  exit 1
fi

BLOCKS="$TEMPO_DATA/blocks"
[ -d "$BLOCKS" ] || { echo "No blocks dir: $BLOCKS"; exit 1; }

aws s3 sync "$BLOCKS" "s3://${BUCKET}/tempo-archive/blocks/" \
  --storage-class STANDARD_IA \
  --only-show-errors || true
