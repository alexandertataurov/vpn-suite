# Security Risk Report

**Audit Date:** 2025-02-21  
**Scope:** VPN Suite, AmneziaWG, control plane

---

## Critical

| ID | Finding | Location | Recommendation | Status |
|----|---------|----------|----------------|--------|
| C1 | Agent token comparison uses `!=` (timing attack) | `backend/app/api/v1/agent.py` | Use `secrets.compare_digest` | **Fixed** |
| C2 | Redis without password | `docker-compose.yml`, Redis service | Add `requirepass`; set REDIS_PASSWORD + REDIS_URL | **Fixed** (optional; set REDIS_PASSWORD in prod) |
| C3 | Bot port 8090 bound to 0.0.0.0 | `docker-compose.yml` | Firewall 8090 or bind `127.0.0.1:8090` | **Fixed** (now 127.0.0.1:8090) |
| C4 | Default SECRET_KEY/ADMIN_PASSWORD in development | `config.py` | `ENVIRONMENT=production` triggers validation; ensure set in prod | Documented |

---

## High

| ID | Finding | Location | Recommendation |
|----|---------|----------|----------------|
| H1 | TLS min version / cipher suite not explicit | Caddyfile | Add `tls` block with `protocols tls1.2 tls1.3` | **Fixed** |
| H2 | No fail2ban for SSH | Host OS | Install and configure fail2ban for sshd |
| H2b | SSH PermitRootLogin yes | /etc/ssh/sshd_config | Set PermitRootLogin no or prohibit-password |
| H3 | Secrets in environment variables | `.env` | Move to Vault / Docker secrets / cloud secrets manager |
| H4 | Monitoring ports exposed (3000, 8080, 9100) | docker-compose | Bind to 127.0.0.1 | **Fixed** |
| H5 | Node-agent Docker socket not read-only | `docker-compose.yml` node-agent | Mount `/var/run/docker.sock:ro` if agent supports read-only |
| H6 | Port 8000 allowed in UFW | UFW rules | admin-api binds 127.0.0.1:8000; remove UFW allow 8000 if unused |

---

## Medium

| ID | Finding | Location | Recommendation |
|----|---------|----------|----------------|
| M1 | Base image vulnerabilities | All images | Run Trivy/Docker Scout regularly; pin digests (already done) |
| M2 | cAdvisor has full host access | cadvisor volumes | Keep on internal network; do not expose 8080 publicly |
| M3 | Rate limit fail-open when Redis down | `rate_limit.py` | Consider `login_rate_limit_fail_closed=True` for strict envs |
| M4 | Webhook idempotency / replay | Webhook handlers | Verify `external_id` dedup; audit logged |
| M5 | Key rotation manual | WG, agent token | Document and automate rotation procedures |
| M6 | Backup files unencrypted | `backup-postgres-redis.sh` | Encrypt pg_dump and Redis dump at rest |
| M7 | pip-audit: ecdsa CVE-2024-23342, starlette CVE-2024-47874 / CVE-2025-54121 | `backend/requirements.txt` | Upgrade ecdsa, starlette (→ FastAPI) to fixed versions |

---

## Low

| ID | Finding | Location | Recommendation |
|----|---------|----------|----------------|
| L1 | CORS empty default | `config.py` | Explicit origins in prod; no wildcard |
| L2 | Slow request threshold 2000ms | `config.py` | Tune per environment |
| L3 | Control plane rebalance dry-run | Config | `control_plane_rebalance_execute_enabled=False` by default; validate before enable |
| L4 | Audit stack (18080, 18000) exposed | docker-compose.audit | Restrict to localhost or VPN-only access |

---

## Recommendations Summary

### Immediate (Critical)

1. **Agent token**: Use timing-safe comparison — **DONE** (secrets.compare_digest)
2. **Redis**: Add `requirepass`; update REDIS_URL
3. **Bot 8090**: Firewall or bind to localhost
4. **Production secrets**: Ensure ENVIRONMENT=production, SECRET_KEY, ADMIN_PASSWORD, BAN_CONFIRM_TOKEN, etc. set

### Short-term (High)

1. TLS: Enforce TLS 1.2+ in Caddy
2. Fail2ban for SSH
3. Image vulnerability scan in CI (Trivy)
4. Secrets manager for production

### Medium-term

1. Key rotation automation
2. Monitoring ports bound to localhost
3. Backup encryption
