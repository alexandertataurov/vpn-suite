#!/usr/bin/env bash
# Archive Prometheus TSDB blocks to S3.
# Requires: AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, PROMETHEUS_ARCHIVE_S3_BUCKET
# Intended to run in a container with prometheus_data mounted at /prometheus.
# Note: this is a raw block sync (no downsampling). For long-term archive/query prefer Thanos/VM/Mimir.
# See docs/observability/archive-pipeline.md
set -e

BUCKET="${PROMETHEUS_ARCHIVE_S3_BUCKET:-}"
PROM_DATA="${PROMETHEUS_DATA_PATH:-/prometheus}"

if [ -z "$BUCKET" ]; then
  echo "PROMETHEUS_ARCHIVE_S3_BUCKET not set. Skipping archive." >&2
  exit 0
fi

if [ ! -d "$PROM_DATA" ]; then
  echo "PROMETHEUS_DATA_PATH missing. Expected TSDB dir at $PROM_DATA" >&2
  exit 1
fi

# TSDB blocks are ULID directories directly under the TSDB path.
aws s3 sync "$PROM_DATA" "s3://${BUCKET}/prometheus-archive/tsdb/" \
  --storage-class STANDARD_IA \
  --exclude "wal/*" \
  --exclude "chunks_head/*" \
  --only-show-errors || true
