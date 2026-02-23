# Endpoint-by-Endpoint Audit

**Audit Date:** 2025-02-21

---

## Endpoint Issues by Severity

### P0 (Critical)

| Endpoint | Issue | Handler | Fix |
|----------|-------|---------|-----|
| POST /webhooks/payments/{provider} | Non-telegram_stars providers unauthenticated; replay/fake payment | webhooks.payment_webhook | Provider allowlist; 400 for unknown; per-provider auth |

### P1 (High)

| Endpoint | Issue | Handler | Fix |
|----------|-------|---------|-----|
| GET /api/v1/devices | limit up to 1000; DoS risk | devices.list_devices | Cap le=200 |
| POST /api/v1/devices/{id}/reset | get_admin_or_bot — bot can reset any device | devices.reset_device | Verify bot only resets devices for users in its context |

### P2 (Medium)

| Endpoint | Issue | Handler | Fix |
|----------|-------|---------|-----|
| POST /api/v1/log/frontend-error | No auth; arbitrary payload; log injection risk | log.log_frontend_error | Validate/sanitize message; cap lengths |
| GET /api/v1/users | phone filter without count_stmt | users.list_users | Add phone to count_stmt |
| POST /webhooks/payments/{provider} | 409 response shape differs from 200 | webhooks.payment_webhook | Use error_body for 409 |
| Multiple | Inconsistent error detail (string vs {code,message}) | Various | Standardize on {code, message} |
| GET /api/v1/outline/keys/config | No rate limit on token download | outline.outline_config_download | Add rate_limit_config_download |
| POST /api/v1/devices/bulk-revoke | No explicit transaction boundary | devices.bulk_revoke_devices | Wrap in transaction |
| GET /api/v1/telemetry/docker/container/{id}/logs | since param validation | telemetry_docker.docker_container_logs | Validate since format |

### P3 (Low)

| Endpoint | Issue | Handler | Fix |
|----------|-------|---------|-----|
| GET /api/v1/peers | Returns raw dicts; no response_model | peers.list_peers | Add Pydantic response_model |
| GET /api/v1/cluster/nodes | No pagination | cluster.get_cluster_nodes | Add limit/offset if nodes scale |
| POST /api/v1/servers | No Idempotency-Key | servers.create_server | Add optional Idempotency-Key |
| POST /api/v1/subscriptions | No Idempotency-Key | subscriptions.create_subscription | Add optional Idempotency-Key |
| OpenAPI | May drift from implementation | - | Add contract tests |

---

## Auth & Permission Verification

| Route pattern | Auth | Verified |
|---------------|------|----------|
| /api/v1/auth/* | login/logout/refresh: none; totp: get_current_admin | OK |
| /api/v1/log/* | none (rate-limited) | OK |
| /api/v1/overview/* | get_admin_or_bot | OK |
| /api/v1/audit | require_audit_read (rejects bot/webapp) | OK |
| /api/v1/cluster/* | require_permission(CLUSTER_*) | OK |
| /api/v1/control-plane/* | require_permission(CLUSTER_*); WS: token query | OK |
| /api/v1/peers/* | require_permission(CLUSTER_*) | OK |
| /api/v1/wg/* | require_permission(CLUSTER_WRITE) | OK |
| /api/v1/servers/* | require_permission or get_admin_or_bot | OK |
| /api/v1/admin/configs/issued/* | require_permission(CLUSTER_READ) | OK |
| /api/v1/admin/configs/{token}/* | Token in path (one-time) | OK |
| /api/v1/users/* | require_permission or get_admin_or_bot | OK |
| /api/v1/devices/* | require_permission or get_admin_or_bot | OK |
| /api/v1/agent/* | X-Agent-Token | OK |
| /api/v1/bot/* | X-API-Key + _require_bot | OK |
| /webhooks/payments/* | X-Telegram-Bot-Api-Secret-Token (telegram_stars only) | P0 gap |
| /api/v1/webapp/* | initData or Bearer session | OK |

---

## Edge Cases Checked

| Endpoint | Empty state | Null handling | Out-of-range paging | Invalid ID |
|----------|-------------|---------------|---------------------|------------|
| list_* | OK (empty list) | OK | limit/offset validated | N/A |
| get_* | 404 | N/A | N/A | 404 |
| POST create | 422 on invalid body | OK | N/A | N/A |
| PATCH/delete | 404 if not found | OK | N/A | 404 |

---

## Duplicated Logic

| Pattern | Endpoints | Canonical |
|---------|-----------|-----------|
| limit/offset Query | users, payments, subscriptions, audit, devices, peers | Shared PaginationParams |
| not_found_404 | admin_configs, some others | error_responses.not_found_404 |
| detail=string vs detail=dict | Many | Standardize on dict |
