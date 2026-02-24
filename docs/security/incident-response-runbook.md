# Incident Response Runbook

**Purpose:** Commercial VPN operator incident handling.

---

## General Flow

1. **Detect** — Alert, log anomaly, or user report
2. **Isolate** — Stop blast radius (revoke, block, disconnect)
3. **Rotate** — Keys, tokens, credentials
4. **Communicate** — Internal; user-facing if required
5. **Recover** — Restore service
6. **Postmortem** — Root cause; prevention

---

## Scenarios

### Agent Compromise

| Step | Action |
|------|--------|
| Detection | Unusual agent traffic; heartbeat from unknown IP; cert mismatch |
| Isolate | Revoke agent cert; remove from AGENT_ALLOW_CIDRS; block IP |
| Rotate | Issue new agent cert; rotate AGENT_SHARED_TOKEN; update nodes |
| Communicate | Notify node operators; rotate node-agent deployment |
| Postmortem | How was cert/credential exposed? Harden deployment |

---

### Key Leak (AmneziaWG)

| Step | Action |
|------|--------|
| Detection | Unusual peer count; traffic spike; abuse report |
| Isolate | Revoke leaked key; block abused IPs; disable affected keys |
| Rotate | Regenerate server keys if needed; re-issue client configs |
| Communicate | Notify affected users; provide new config |
| Postmortem | How was key shared? Rate-limit config issuance |

---

### Redis Compromise

| Step | Action |
|------|--------|
| Detection | Unauthorized access; unexpected keys; auth failures |
| Isolate | Restrict Redis to localhost; rotate REDIS_PASSWORD |
| Rotate | REDIS_PASSWORD; invalidate sessions (SECRET_KEY change forces re-login) |
| Communicate | All admins must re-login |
| Postmortem | Network exposure? Auth weak? |

---

### DB Compromise

| Step | Action |
|------|--------|
| Detection | Unusual queries; backup integrity check failure; audit anomaly |
| Isolate | Restrict DB to app network; revoke compromised credentials |
| Rotate | DB passwords; consider credential rotation for integrations |
| Communicate | Legal/compliance; user notification if PII exposed |
| Postmortem | SQLi? Credential theft? Access control gap? |

---

### JWT Signing Key Leak

| Step | Action |
|------|--------|
| Detection | Tokens validated from unexpected origin; key in logs/repo |
| Isolate | Invalidate all sessions (force re-login) |
| Rotate | SECRET_KEY; redeploy with new key |
| Communicate | All admins re-login |
| Postmortem | Logging? Repo exposure? |

---

### Admin Credential Compromise

| Step | Action |
|------|--------|
| Detection | Login from unknown IP; audit log anomaly; MFA bypass |
| Isolate | Disable affected admin; force password reset |
| Rotate | Admin password; MFA reset; audit all actions by that admin |
| Communicate | Security team; revoke other sessions |
| Postmortem | Phishing? Credential reuse? |

---

### Server Lag → Connections Drop (restart fixes)

| Step | Action |
|------|--------|
| Detection | Users report disconnects; health checks fail; NodeMemoryPressure / NodeSwapHeavy alerts |
| Isolate | Identify cause: memory/swap pressure, nf_conntrack full, or runaway process |
| Recover | `./ops/restart-core-stack.sh` or `./manage.sh down-core && ./manage.sh up-core`; if host-level, reboot |
| Prevention | Apply `ops/sysctl-hardening.conf`; add RAM if swap consistently high; enable NodeMemoryPressure/NodeSwapHeavy alerts; consider container memory limits |

---

### DDoS Event

| Step | Action |
|------|--------|
| Detection | Traffic spike; rate limit hits; latency increase |
| Isolate | Enable upstream WAF/DDoS mitigation; geo-block if applicable |
| Rotate | N/A |
| Communicate | Status page; "under attack" mode notice |
| Postmortem | Attack vector? Scale limits? |

---

## Contacts

- On-call: [define]
- Escalation: [define]
- Legal/Compliance: [define]

---

## Key Rotation Procedures

| Asset | Command / Procedure |
|-------|---------------------|
| AGENT_SHARED_TOKEN | `./ops/rotate-agent-token.sh` |
| SECRET_KEY | Set in .env; restart admin-api |
| Redis password | Set REDIS_PASSWORD; update REDIS_URL; restart stack |
| Postgres password | Change in DB; update DATABASE_URL; restart |
| Agent certs | `./scripts/generate-agent-client-cert.sh`; distribute to nodes |
