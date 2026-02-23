# Hardening Checklist (Security + Ops + DPI Risk Review)

## Security

- Secrets hygiene:
  - `secrets/` and `.env*` are never committed.
  - CI secret scan (gitleaks) is green.
  - all secret files on disk are `chmod 600`.
- Auth/RBAC:
  - admin endpoints require Bearer JWT and `require_permission(...)`.
  - telemetry logs require `telemetry:logs:read`.
  - rate limits enabled for login + global API.
- Webhooks/payments:
  - provider webhook secret verified where supported (Telegram Stars header).
  - idempotency by `external_id` verified with replay tests.
  - all webhook mutations are audit logged (`admin_id=webhook`).
- Agent boundary:
  - mTLS enforced at reverse-proxy on `:8443`.
  - `AGENT_SHARED_TOKEN` set (>= 32 chars) and rotated via `ops/rotate-agent-token.sh`.
  - optional CIDR allowlist (`AGENT_ALLOW_CIDRS`) tightened for production.

## Ops

- Backups:
  - daily pg_dump via `ops/systemd/vpn-suite-backup-db.timer`.
  - restore drill performed once on staging using `./manage.sh restore-db --force ...`.
- Isolation:
  - control-plane host runs only expected containers for its role.
  - no public exposure of Postgres/Redis; bot port exposure is explicitly firewalled or bound to localhost.
- Release procedure:
  - `./manage.sh migrate` is run before rolling forward.
  - rollback is documented: revert deploy to previous image + restore DB only if a migration is incompatible.

## DPI Risk Review (Policy-Safe)

This section is operational risk awareness only.

- Monitor for reachability regressions:
  - handshake health, node “last seen”, error rate spikes, and region-specific availability checks.
- Keep any AmneziaWG obfuscation tuning guidance internal:
  - require legal/compliance review before shipping prescriptive guidance.
- Document MTU/fragmentation troubleshooting and safe rollback steps for config changes.
