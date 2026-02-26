# Rollout Plan

## P0 Implementation Rollout

The fixes executed across the repo have zero database migrations and no external API topology changes. They are fully backward compatible.

### Risk Assessment

1.  **Docker Compose resource limits (`docker-compose.yml`)**
    *   *Risk*: Low. Setting max caps on prometheus/grafana prevents host OOMs.
    *   *Rollback*: `docker compose up -d` with previous `yml` version.
2.  **`admin_issue_service.py` DRY config generator**
    *   *Risk*: Medium. Crypto string generation is sensitive. If the new `_build_all_configs` tuple returns the wrong order, clients fail to connect.
    *   *Rollback*: Revert python file in `backend`.
3.  **`agent.py` Sysctl/Iptables caching**
    *   *Risk*: Low. Drops unneeded `docker exec` calls.
    *   *Rollback*: Tag previous `node-agent` image.

### Phased Deployment (Staging to Prod)

1.  Merge branch `feat/performance-audit-p0`.
2.  Deploy to `staging.admin.vpn.com`.
3.  Run load tests: `k6 run scripts/telemetry-snapshot-k6.js`.
4.  If metrics show `p95` drops as expected, proceed to production roll-forward.

If errors > 1%, execute prompt standard rollback (`git revert`).
