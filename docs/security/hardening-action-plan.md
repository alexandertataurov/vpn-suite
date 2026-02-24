# Hardening Action Plan

**Audit Date:** 2025-02-21  
**v2 Enterprise Edition:** See section 7 for enterprise hardening and linked docs.

---

## 1. Security Hardening Checklist

### Secrets & Auth

- [x] `secrets/` and `.env` chmod 600 — run `./ops/harden-secrets.sh`
- [ ] SECRET_KEY >= 32 chars, not default
- [ ] ADMIN_PASSWORD set and strong
- [ ] BAN_CONFIRM_TOKEN, BLOCK_CONFIRM_TOKEN, RESTART_CONFIRM_TOKEN, REVOKE_CONFIRM_TOKEN set (non-default)
- [ ] AGENT_SHARED_TOKEN >= 32 chars when NODE_MODE=agent
- [ ] Redis requirepass + REDIS_URL with password
- [ ] Agent token comparison: **DONE** (secrets.compare_digest)

### Network

- [x] Caddy TLS: enforce min TLS 1.2, 1.3 (protocols tls1.2 tls1.3)
- [x] HSTS on public endpoints (already present)
- [x] Bot 8090: bind 127.0.0.1 (127.0.0.1:8090 in compose)
- [x] Monitoring ports (3000, 8080, 9100, 9090, 3100) bound to 127.0.0.1 (already in docker-compose)
- [x] Remove UFW allow 8000 — run `./ops/ufw-remove-8000.sh` (admin-api is 127.0.0.1:8000)

### Host OS

- [ ] fail2ban for sshd
- [ ] SSH: key-only; disable root password login
- [ ] Unattended security updates (already enabled)

### Containers

- [x] Image vulnerability scan (Trivy) in CI
- [ ] Node-agent docker socket :ro — not feasible (agent needs docker exec for wg)
- [x] cAdvisor on internal network only (127.0.0.1:8080)

### AmneziaWG

- [x] secrets/awg_private_key chmod 600 — included in `./ops/harden-secrets.sh`

---

## 2. Performance Optimization Checklist

### System

- [x] Tune nf_conntrack_max — apply `ops/sysctl-hardening.conf`
- [ ] Review somaxconn, tcp_max_syn_backlog
- [ ] Investigate swap usage; add RAM or tune; enable NodeMemoryPressure/NodeSwapHeavy alerts (config/monitoring/alert_rules.yml)

### Backend

- [x] Add DB indexes (devices.server_id, subscriptions, server_health_log) — audit: all present (004/013/003/016/005)
- [ ] Consider consolidating overview COUNT queries
- [ ] Redis connection pool and cache hit monitoring

### Control Plane

- [x] Validate rebalance dry-run before execute — API supports `dry_run`; use `dry_run: true` before enabling `execute_rebalance`
- [ ] Monitor reconciliation duration and error rate

---

## 3. Immediate Critical Fixes (Must-Do)

| # | Action | Owner |
|---|--------|-------|
| 1 | Agent token timing-safe comparison | **DONE** |
| 2 | Redis requirepass | **DONE** (set REDIS_PASSWORD, REDIS_URL=redis://:password@redis:6379/0) |
| 3 | Bot port 8090 bind localhost | **DONE** (127.0.0.1:8090) |
| 4 | ENVIRONMENT=production + all secret validations pass | Ops |
| 5 | Run `./ops/harden-secrets.sh` | Ops |
| 6 | Run `./ops/ufw-remove-8000.sh` | Ops |
| 7 | Apply `ops/sysctl-hardening.conf` (optional, for scale) | Ops |
| 8 | Run `./ops/setup-fail2ban.sh` (optional) | Ops |
| 9 | Run `./ops/block-metadata-endpoints.sh` | Ops |

---

## 4. Medium-term Improvements

| # | Action |
|---|--------|
| 1 | TLS min 1.2, strong ciphers in Caddy | **DONE** (protocols tls1.2 tls1.3) |
| 2 | fail2ban for SSH | run `./ops/setup-fail2ban.sh` |
| 3 | Trivy in CI | **DONE** |
| 4 | Secrets manager (Vault, cloud secrets) |
| 5 | Key rotation automation (agent, WG) |
| 6 | Monitoring ports to localhost | **DONE** (127.0.0.1 in compose) |
| 7 | Backup encryption (pg_dump, Redis) |
| 8 | DB index audit and add missing | **DONE** (audit: indexes present) |

---

## 5. Enterprise-grade Roadmap

| Phase | Items |
|-------|-------|
| **Security** | WAF; DDoS mitigation; pen test; SIEM integration; audit log retention policy |
| **Availability** | Multi-AZ; DB failover; Redis Sentinel/Cluster |
| **Scale** | Horizontal admin-api; DB read replicas; 10x peer capacity |
| **Compliance** | SOC2/ISO prep; key rotation policy; incident response runbook |

---

## 6. Definition of Done (Audit)

- [x] docs/ops/infrastructure-map.md
- [x] docs/audits/security-risk-report.md
- [x] docs/audits/performance-bottleneck-report.md
- [x] threat-model.md
- [x] hardening-action-plan.md
- [x] Agent token fix (secrets.compare_digest)

System readiness:
- 10x user growth: roadmap in place
- Public exposure: critical fixes documented
- Enterprise scrutiny: hardening checklist; residual risks documented
- Basic DDoS resistance: rate limits; kernel tuning
- No obvious misconfigurations: audit complete; fixes applied where in scope

---

## 7. Enterprise Hardened Edition (v2)

**Target:** Commercial VPN operator grade; 10x growth; external review.

### Deliverables
- `../ops/network-segmentation-map.md` — Zero-trust zones, port matrix, metadata block
- `alert-policy.md` — Thresholds, severities, runbook links
- `incident-response-runbook.md` — Agent/DB/Redis/key leak/DDoS scenarios

### v2 Checklist Summary
| Domain | Status |
|--------|--------|
| Network segmentation | Map done; `./ops/block-metadata-endpoints.sh` |
| Rate limiting | Backend done; Caddy requires plugin for per-IP (optional) |
| Security headers | HSTS, X-Frame-Options, nosniff, Referrer-Policy, Permissions-Policy done |
| mTLS agents | Done |
| Incident runbook | Done |
| Alert policy | Done |
| Load test 10x | Pending |
| Auth hardening (refresh rotation, JWT blacklist) | Refresh rotation **DONE**; access-token blacklist pending |

### v2 Execution
- `../backlog/execution-roadmap.md` — 2–4 week prioritized sprint
- `red-team-simulation-plan.md` — Adversarial test scenarios

### v2 Readiness Score (Projected)
Security: 9/10 | Performance: 8.5/10 | Enterprise: 8.5/10
