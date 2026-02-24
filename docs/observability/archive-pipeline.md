# Archive Pipeline — 365d Retention → Cold Storage

**Phase 2.3.5.** After 365 days retention, export data to S3/GCS before deletion. Design and runbook.

---

## 1. Overview

| Data type | Hot retention | Archive target | Mechanism |
|-----------|---------------|----------------|-----------|
| Metrics   | 365d (Prometheus TSDB) | S3/GCS | Thanos/mimir/VM or tsdb export (see §3) |
| Logs      | 365d (Loki)   | S3/GCS | Loki native S3/GCS storage or sync job |
| Traces    | 365d (Tempo)  | S3/GCS | Tempo native S3/GCS backend |

---

## 2. Loki — S3/GCS Archive

**Option A: Loki primary storage = S3**

Set `common.storage` and `schema_config` to use S3. Example (`loki-config-s3.yml`):

```yaml
common:
  path_prefix: /tmp/loki
  storage:
    s3:
      endpoint: ${S3_ENDPOINT:-s3.amazonaws.com}
      bucketnames: ${S3_BUCKET}
      access_key_id: ${AWS_ACCESS_KEY_ID}
      secret_access_key: ${AWS_SECRET_ACCESS_KEY}
      s3forcepathstyle: false
  # ... ring, etc.

schema_config:
  configs:
    - from: "2024-01-01"
      store: tsdb
      object_store: s3
      schema: v13
      index:
        prefix: loki_index_
        period: 24h
```

**Option B: Filesystem + sync to S3 before retention delete**

Cron job runs before compactor deletes:
- `aws s3 sync /var/lib/loki/chunks s3://bucket/loki-archive/chunks --exclude "*" --include "*-365d-*"` (adjust paths/patterns)
- Or use `rclone sync` to GCS.

---

## 3. Tempo — S3/GCS Backend

Tempo supports S3/GCS as storage. Add to `tempo.yaml`:

```yaml
storage:
  trace:
    backend: s3
    s3:
      bucket: ${TEMPO_S3_BUCKET}
      endpoint: ${S3_ENDPOINT:-s3.amazonaws.com}
      access_key: ${AWS_ACCESS_KEY_ID}
      secret_key: ${AWS_SECRET_ACCESS_KEY}
```

GCS: use `backend: gcs` and `gcs.bucket_name`, `gcs.credentials_file`.

---

## 4. Prometheus — Archive Options

Prometheus has no native S3 export. Options:

1. **Thanos Sidecar + Compact** — Run Thanos Compact to downsample and upload to S3. Requires Thanos deployment.
2. **VictoriaMetrics** — Replace Prometheus with VM; use `-remoteWrite.storageNode` for long-term S3.
3. **Mimir** — Drop-in replacement with S3 backend.
4. **Manual tsdb export** — `promtool tsdb create-blocks-from open --storage.tsdb.path=...` exports to blocks; then sync to S3. Not automated.

**Recommendation:** For minimal compose, keep Prometheus 365d retention. For archive, plan migration to VictoriaMetrics or Mimir when long-term archive is required.

---

## 5. Env Vars (Archive Profiles)

| Var | Purpose |
|-----|---------|
| `S3_BUCKET` | Loki/Tempo S3 bucket |
| `AWS_ACCESS_KEY_ID` | S3 access |
| `AWS_SECRET_ACCESS_KEY` | S3 secret |
| `S3_ENDPOINT` | Optional (e.g. MinIO) |
| `TEMPO_S3_BUCKET` | Tempo blocks bucket |
| `GCS_BUCKET` | For GCS instead of S3 |
| `GOOGLE_APPLICATION_CREDENTIALS` | GCS credentials file path |

---

## 6. Cron / Runbook

1. **Loki:** If using Option B, add cron:
   ```cron
   0 2 * * * /opt/vpn-suite/scripts/archive-loki-to-s3.sh
   ```
   Script: sync chunks older than 350d to S3, then let compactor delete.

2. **Tempo:** Switch config to S3 backend; restart. No cron — Tempo writes directly to S3.

3. **Prometheus:** Defer until Thanos/VM/Mimir adopted.

---

## 7. Scripts Stub

- `scripts/archive-loki-to-s3.sh` — Template for rclone/aws s3 sync of Loki chunks (create when S3 profile enabled).
- See `scripts/` for existing ops scripts.
