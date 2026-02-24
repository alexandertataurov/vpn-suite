# Hardening Guide

Production security checklist, ops scripts, and deployment validation.

---

## 1. Secrets & Auth

| Check | Status | Action |
|-------|--------|--------|
| secrets/ and .env chmod 600 | Done | `./ops/harden-secrets.sh` |
| SECRET_KEY ≥ 32 chars, non-default | — | Set in .env |
| ADMIN_PASSWORD strong | — | Set on seed |
| BAN_CONFIRM_TOKEN, BLOCK_CONFIRM_TOKEN, RESTART_CONFIRM_TOKEN, REVOKE_CONFIRM_TOKEN | — | Non-default per env |
| AGENT_SHARED_TOKEN ≥ 32 chars (NODE_MODE=agent) | — | Required for agent mode |
| Redis requirepass | Done | REDIS_PASSWORD + REDIS_URL |
| Agent token timing-safe comparison | Done | secrets.compare_digest |
| JWT refresh rotation | Done | Backend |

---

## 2. Network

| Check | Status | Action |
|-------|--------|--------|
| Caddy TLS 1.2/1.3 | Done | protocols tls1.2 tls1.3 |
| HSTS on public endpoints | Done | Caddy |
| Bot 8090 bind 127.0.0.1 | Done | docker-compose |
| Monitoring ports localhost | Done | Prometheus, Grafana, cAdvisor, node-exporter |
| Remove UFW allow 8000 | — | `./ops/ufw-remove-8000.sh` |
| Block metadata endpoints | — | `./ops/block-metadata-endpoints.sh` |
| Agent mTLS boundary | Done | Caddy :8443; ops/pki/agent-mtls.sh |

---

## 3. Host OS

| Check | Action |
|-------|--------|
| fail2ban for sshd | `./ops/setup-fail2ban.sh` |
| SSH key-only; disable root login | PermitRootLogin no |
| Unattended security updates | Enable |
| nf_conntrack tuning | `sysctl -p ops/sysctl-hardening.conf` |

---

## 4. Containers

| Check | Status |
|-------|--------|
| Trivy image scan in CI | Done |
| cAdvisor internal only | 127.0.0.1:8080 |
| awg_private_key chmod 600 | `./ops/harden-secrets.sh` |

---

## 5. Ops Scripts Summary

| Script | Purpose |
|--------|---------|
| `./ops/harden-secrets.sh` | chmod 600 secrets/, .env |
| `./ops/ufw-remove-8000.sh` | Remove UFW allow 8000 |
| `./ops/block-metadata-endpoints.sh` | Block 169.254.169.254, 169.254.170.2 |
| `./ops/setup-fail2ban.sh` | fail2ban for sshd |
| `./ops/sysctl-hardening.conf` | nf_conntrack, kernel tuning |
| `./ops/rotate-agent-token.sh` | Rotate AGENT_SHARED_TOKEN |
| `./ops/pki/agent-mtls.sh` | Agent mTLS PKI |

---

## 6. Webhooks & RBAC

- Provider webhook secret verified (Telegram Stars header)
- Idempotency by external_id (replay tests)
- All webhook mutations audit logged (admin_id=webhook)
- Admin endpoints require Bearer JWT + `require_permission(...)`
- Telemetry logs require `telemetry:logs:read`

---

## 7. Production Pre-flight

1. ENVIRONMENT=production
2. All secret validations pass
3. `./ops/harden-secrets.sh`
4. `./ops/ufw-remove-8000.sh`
5. `./ops/block-metadata-endpoints.sh`
6. Optional: `sysctl -p ops/sysctl-hardening.conf`
7. Optional: `./ops/setup-fail2ban.sh`

---

## 8. DPI Risk (Policy Awareness)

- Monitor reachability regressions: handshake health, last_seen, error spikes
- AmneziaWG obfuscation guidance: internal only; legal/compliance review before prescriptive docs
- Document MTU/fragmentation troubleshooting and safe rollback
