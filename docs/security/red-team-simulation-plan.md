# Red Team Simulation Plan v1

**Purpose:** Adversarial testing of VPN Suite before enterprise claim.

---

## Scope

- Control-plane API (admin-api, Caddy)
- Agent mTLS boundary
- Auth (login, JWT, refresh)
- Rate limits
- Data layer (no direct access; test via API)
- Outline / AmneziaWG config issuance

---

## Scenarios

### 1. Auth Bypass

| Test | Expected |
|------|----------|
| Request /api/v1/servers without token | 401 |
| Request with expired JWT | 401 |
| Request with tampered JWT | 401 |
| Request with valid token, wrong scope | 403 |

### 2. Rate Limit Bypass

| Test | Expected |
|------|----------|
| 100+ login attempts from single IP in 1 min | 429 after threshold |
| 1000+ API requests/min from single IP | 429 after threshold |
| Config download burst (per token) | 429 after limit |

### 3. Agent Impersonation

| Test | Expected |
|------|----------|
| POST /api/v1/agent/* without client cert | 401 / TLS failure |
| POST with wrong client cert | 401 |
| POST with valid cert, wrong X-Agent-Token | 401 |
| POST with valid cert + token, unknown server_id | 404 or no-op |

### 4. SSRF / Metadata

| Test | Expected |
|------|----------|
| Admin API triggers request to 169.254.169.254 | Blocked (iptables) or timeout |
| Config issuance with internal IP in payload | Rejected or sanitized |

### 5. Privilege Escalation

| Test | Expected |
|------|----------|
| Admin A accesses Admin B resources (different IDs) | 403 |
| User token used for admin endpoints | 401 |

### 6. Replay / Idempotency

| Test | Expected |
|------|----------|
| Replay same payment webhook twice | Idempotent; no double credit |
| Replay same action with same request_id | Rejected or idempotent |

### 7. Injection

| Test | Expected |
|------|----------|
| SQLi in login, device name, server name | Sanitized; no DB compromise |
| XSS in admin UI | CSP / escaping prevents execution |

---

## Execution

1. Run tests in non-production first.
2. Document findings; severity (Critical/High/Medium/Low).
3. Fix Critical/High before enterprise claim.
4. Re-run after fixes.

---

## Tools

- curl / httpx for API tests
- Burp Suite or similar for auth/replay
- Custom scripts for rate-limit and agent tests
