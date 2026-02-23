# Hardening Execution Roadmap (2–4 Weeks)

**Target:** Enterprise-hardened commercial VPN; 10× growth ready.

---

## Week 1: Critical Ops + Network

| Day | Task | Owner |
|-----|------|-------|
| 1 | Run `./ops/harden-secrets.sh`; verify .env secrets (SECRET_KEY, REDIS_URL, confirm tokens) | Ops |
| 1 | Run `./ops/ufw-remove-8000.sh`; run `./ops/block-metadata-endpoints.sh` | Ops |
| 2 | Apply `ops/sysctl-hardening.conf`; run `./ops/setup-fail2ban.sh` | Ops |
| 2 | Restart Caddy for new headers: `docker compose restart reverse-proxy` | Ops |
| 3 | Set ENVIRONMENT=production; validate no default credentials; smoke test | Ops |
| 4 | Tighten AGENT_ALLOW_CIDRS if agent IPs known | Ops |
| 5 | SSH: key-only; disable root password (document in runbook) | Ops |

---

## Week 2: Auth + Data

| Day | Task | Owner |
|-----|------|-------|
| 1–2 | Refresh token rotation on use (backend) | Dev |
| 2 | Refresh token invalidation on logout | Dev |
| 3 | JWT blacklist / revocation (Redis-based) | Dev |
| 4 | Encrypted backups: pg_dump + gpg; Redis RDB encryption | Ops |
| 5 | Audit log retention policy document | Ops |

---

## Week 3: Scale + Validation

| Day | Task | Owner |
|-----|------|-------|
| 1–2 | Load test: 10× peers; 1000 reconnects; rebalance under load | Dev/Ops |
| 3 | Deliver LOAD_TEST_REPORT.md | Dev |
| 4 | DB index audit; add missing indexes (devices, server_health_log) | Dev |
| 5 | Rebalance dry-run validation before execute | Dev |

---

## Week 4: Compliance + Polish

| Day | Task | Owner |
|-----|------|-------|
| 1 | Key rotation policy document; link to INCIDENT_RESPONSE_RUNBOOK | Ops |
| 2 | Backup restore drill | Ops |
| 3 | Red Team simulation (see RED_TEAM_SIMULATION_PLAN.md) | Security |
| 4 | External pentest prep (scope, contacts) | Ops |
| 5 | Final readiness review; update Definition of Done | All |

---

## Dependencies

- Week 1 blocks Week 2 (env must be production-ready)
- Load test (Week 3) validates sysctl + kernel tuning from Week 1
- Auth hardening (Week 2) independent; can parallelize with backup work
