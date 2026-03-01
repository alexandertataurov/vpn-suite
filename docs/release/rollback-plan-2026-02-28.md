# Rollback Plan (2026-02-28)

## Scope

Rollback strategy for blocker/high-risk hardening delivered in the pre-release review.

## Immediate feature-flag mitigations

1. Disable env editor immediately:
   - `APP_ENV_EDITOR_ENABLED=0`
2. Disable/throttle frontend telemetry ingestion:
   - `ADMIN_TELEMETRY_EVENTS_ENABLED=0`
   - or set `ADMIN_TELEMETRY_SAMPLE_RATE=<0..1>`

## Safe rollback order

1. **PR6 (chart formatter/state handling)** can be reverted independently.
2. **PR5 (telemetry ingest + FE batching)** can be reverted independently.
3. **PR4 (critical-page UX/debug packet layer)** can be reverted independently.
4. **PR3 (idempotency/correlation headers)** can be reverted independently if Redis/idempotency behavior regresses.
5. **PR2 (settings security hardening)** should only be reverted with explicit security approval.
6. **PR1 (route precedence fix)** is release-blocking correctness; do not revert unless replacing with equivalent route fix.

## Operational fallback procedures

### Telemetry ingestion issues

1. Set `ADMIN_TELEMETRY_EVENTS_ENABLED=0`.
2. Keep legacy `POST /api/v1/log/frontend-error` path active.
3. Validate:
   - `curl -sS http://127.0.0.1:8000/metrics | rg 'frontend_telemetry_(events|batches)_total'`

### Idempotency issues

1. Temporarily stop sending `Idempotency-Key` from FE mutating actions (hotfix client).
2. Keep core sync/reissue endpoint logic active.
3. Validate replay behavior with and without key before re-enabling.

### Settings endpoint emergency lock

1. Ensure `APP_ENV_EDITOR_ENABLED=0`.
2. Keep `settings:dangerous` permission limited to trusted roles only.
3. Verify:
   - `GET /api/v1/app/env` returns `403 ENV_EDITOR_DISABLED`.

## Verification after rollback

1. `BASE_URL=http://127.0.0.1:8000 bash scripts/release_api_happy_path.sh`
2. Confirm:
   - `/api/v1/servers/device-counts` remains `200`
   - `/health` and `/metrics` are healthy
3. Check recent logs:
   - `docker compose logs admin-api --since 15m | rg 'error|traceback|request_id|correlation_id'`
