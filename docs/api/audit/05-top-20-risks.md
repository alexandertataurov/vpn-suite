# Top 20 API Risks

**Audit Date:** 2025-02-21

---

| # | Risk | File(s) | Severity | Reproduction | Fix |
|---|------|---------|----------|--------------|-----|
| 1 | Webhook unauthenticated for non-telegram_stars | webhooks.py | P0 | POST /webhooks/payments/mock with fake payload → 200 | Provider allowlist; 400 for unknown; per-provider auth |
| 2 | devices list limit=1000 | devices.py:70 | P1 | GET /api/v1/devices?limit=1000 → large response | Cap le=200 |
| 3 | log/frontend-error no auth, log injection | log.py | P2 | POST /api/v1/log/frontend-error with message containing secrets | Validate/sanitize; cap message length |
| 4 | Webhook replay for unknown provider | webhooks.py | P0 | POST /webhooks/payments/fake_provider | Reject unknown provider 400 |
| 5 | Bot reset_device: no user-scoping check | devices.py:216 | P1 | Bot calls reset with device_id of another user's device | **Verify:** Bot must validate device belongs to user context; add check if missing |
| 6 | Inconsistent error detail format | Multiple | P2 | Compare 404 from peers vs webapp | Standardize on {code, message} |
| 7 | users list: phone filter without count_stmt | users.py:93 | P2 | GET /api/v1/users?phone=x → total wrong when filtering by phone | Add phone to count_stmt |
| 8 | Webhook 409 response shape differs from 200 | webhooks.py:139 | P2 | 409 returns {status, detail}; 200 returns {status, payment_id} | Use error_body for 409 |
| 9 | Agent heartbeat creates Server without validation | agent.py:80 | P2 | POST /agent/heartbeat with server_id="x"*1000 | Validate server_id format; limit length |
| 10 | Missing idempotency on create_server, create_subscription | servers.py, subscriptions.py | P3 | Duplicate POST creates duplicate resources | Add Idempotency-Key header support |
| 11 | peers list returns raw dicts | peers.py:55 | P3 | GET /api/v1/peers → no schema validation | Add Pydantic response_model |
| 12 | cluster/nodes no pagination | cluster.py | P3 | GET /api/v1/cluster/nodes with 1000+ nodes | Add limit/offset |
| 13 | Role permissions: "*" grants all | rbac.py:25 | P2 | Admin with permissions=["*"] | Document; consider explicit allowlist |
| 14 | CORS allow_credentials with empty origins | config.py:42 | P2 | cors_allow_origins="" with allow_credentials=True | Document: empty = no CORS |
| 15 | Refresh blocklist Redis fail-open | auth.py:154 | P2 | Redis down during refresh → blocklist set fails | Document; optional fail-closed |
| 16 | telemetry_docker logs: since param injection | telemetry_docker.py:126 | P2 | GET .../logs?since=malicious | Validate since format |
| 17 | Bulk revoke: no transaction boundary | devices.py:44 | P2 | Partial failure leaves inconsistent state | Wrap in explicit transaction |
| 18 | outline/keys/config?token= no rate limit | outline.py:340 | P2 | Brute-force token | Add rate_limit_config_download |
| 19 | OpenAPI may drift from implementation | openapi/ | P3 | Schema vs handler mismatch | Add contract tests |
| 20 | WebApp session token 1h; no refresh | webapp.py | P2 | User session expires mid-flow | Document; consider refresh flow |

---

## Fix Priority

1. **P0 (ship immediately):** #1, #4 — Webhook provider allowlist
2. **P1 (next sprint):** #2, #5 — devices limit, bot reset scoping
3. **P2 (backlog):** #3, #6–9, #13–18, #20
4. **P3 (tech debt):** #10–12, #19
