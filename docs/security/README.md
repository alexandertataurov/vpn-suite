# Security Documentation

Overview of VPN Suite security posture, controls, and operations.

---

## Index

| Doc | Purpose |
|-----|---------|
| [threat-model.md](threat-model.md) | Attack surface, mitigations, trust boundaries |
| [hardening.md](hardening.md) | Hardening checklist, ops scripts |
| [incident-response-runbook.md](incident-response-runbook.md) | Incident scenarios, key rotation, contacts |
| [alert-policy.md](alert-policy.md) | Alert thresholds, severities, runbook links |
| [red-team-simulation-plan.md](red-team-simulation-plan.md) | Adversarial test scenarios |

---

## Architecture Summary

- **Control-plane API** (admin-api, Caddy): Auth (JWT + TOTP), RBAC, rate limits
- **Agent boundary**: mTLS + X-Agent-Token; AGENT_ALLOW_CIDRS optional
- **Data layer**: Postgres, Redis — internal network only; requirepass
- **Monitoring**: Prometheus, Grafana, cAdvisor, node-exporter — 127.0.0.1

See [../ops/network-segmentation-map.md](../ops/network-segmentation-map.md) for zones and port matrix.

---

## Quick Reference

| Task | Command |
|------|---------|
| Harden secrets | `./infra/scripts/ops/harden-secrets.sh` |
| Block metadata endpoints | `./infra/scripts/ops/block-metadata-endpoints.sh` |
| Rotate agent token | `./infra/scripts/ops/rotate-agent-token.sh` |
| Remove UFW 8000 | `./infra/scripts/ops/ufw-remove-8000.sh` |
| Setup fail2ban | `./infra/scripts/ops/setup-fail2ban.sh` |
| Apply sysctl tuning | `sysctl -p infra/scripts/ops/sysctl-hardening.conf` |
| Agent mTLS PKI | `./infra/scripts/pki/agent-mtls.sh` |
