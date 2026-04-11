# Telemetry Retention and Cost Optimization

## Retention

| Data | Hot retention | Long-term | Cold storage |
|------|----------------|-----------|--------------|
| Metrics (Prometheus) | 30–90 days high-res | 365d VictoriaMetrics | Optional export to S3 |
| Metrics (recording rules) | — | 1y in VM (daily aggregates) | — |
| Logs (Loki) | 7–30 days (tune `retention_period`) | Up to 365d if needed | archive-loki-to-s3.sh |
| Traces (Tempo) | 7–30 days | — | archive-tempo-to-s3 (profile) |

- **Prometheus:** `--storage.tsdb.retention.time=365d` or lower (e.g. 90d) to control disk; remote_write to VictoriaMetrics for 365d queryable.
- **Loki:** `limits_config.retention_period` (e.g. `720h` for 30d); compactor for retention.
- **Tempo:** `compactor.compaction.block_retention` (e.g. `168h` for 7d).

## Cost Optimization

- **Downsample after 90d:** Use recording rules for daily/weekly aggregates; query VM for long ranges.
- **Limit cardinality:** Avoid high-cardinality labels (e.g. user_id, full path); use path_template, status_class.
- **Loki:** Retention + compaction; limit ingestion rate and line size.
- **Scale vertically first:** Single Prometheus/VictoriaMetrics instance before sharding. Monitor scrape duration and TSDB size.
- **Archive pipeline:** Run `archive-prometheus-to-s3.sh`, `archive-loki-to-s3.sh`, `archive-tempo-to-s3.sh` on schedule (e.g. weekly) for cold storage; delete or retain per policy.
