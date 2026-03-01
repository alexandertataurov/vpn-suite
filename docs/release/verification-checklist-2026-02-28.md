# Verification Checklist (2026-02-28)

## Automated commands

1. `cd /opt/vpn-suite && ./manage.sh config-validate`
2. `cd /opt/vpn-suite/backend && ruff check app/api/v1/servers.py app/api/v1/app_settings.py app/api/v1/servers_sync.py app/api/v1/devices.py app/api/v1/log.py app/core/config.py app/core/constants.py app/core/error_responses.py app/core/request_logging_middleware.py app/core/idempotency.py app/core/logging_config.py app/core/metrics.py tests/test_servers_routes_precedence.py tests/test_app_settings_authz.py tests/test_idempotency_sync_reissue.py tests/test_frontend_telemetry_ingest.py`
3. `docker run --rm -v /opt/vpn-suite/backend:/workspace -w /workspace vpn-suite-admin-api sh -lc 'pip install --no-cache-dir --target /tmp/pytestpkgs pytest pytest-asyncio >/tmp/pip_pytest.log 2>&1 && PYTHONPATH=/tmp/pytestpkgs PYTHONDONTWRITEBYTECODE=1 python -m pytest -p no:cacheprovider tests/test_servers_routes_precedence.py tests/test_app_settings_authz.py tests/test_idempotency_sync_reissue.py tests/test_frontend_telemetry_ingest.py -v'`
4. `cd /opt/vpn-suite/frontend && npm test -- --run`
5. `cd /opt/vpn-suite && BASE_URL=http://127.0.0.1:8000 bash scripts/release_api_happy_path.sh`

## Manual API checks

1. `GET /api/v1/servers/device-counts` returns `200` with `counts` map.
2. `GET /api/v1/app/settings` includes `capabilities`.
3. `GET /api/v1/app/env` returns `403` when `APP_ENV_EDITOR_ENABLED=0`.
4. Replay sync with same `Idempotency-Key` returns same payload.
5. `POST /api/v1/log/events` accepts login_failure batch without auth.
6. `/health` echoes `X-Request-ID` and `X-Correlation-ID`.

## Expected evidence artifacts

- Happy path report:
  - `reports/release-api-ui-verification/happy_path_results.txt`
- Samples:
  - `reports/release-api-ui-verification/samples/servers_device_counts.json`
  - `reports/release-api-ui-verification/samples/app_settings_capabilities.json`
  - `reports/release-api-ui-verification/samples/app_env_disabled_body.json`
  - `reports/release-api-ui-verification/samples/sync_idempotency_replay.json`
  - `reports/release-api-ui-verification/samples/telemetry_login_failure_noauth.json`
  - `reports/release-api-ui-verification/samples/telemetry_events_ingest.json`
  - `reports/release-api-ui-verification/samples/frontend_telemetry_metrics_snippet.txt`
  - `reports/release-api-ui-verification/samples/headers_echo_health.txt`

## UI/Playwright evidence status

Planned commands:

1. `export CODEX_HOME="${CODEX_HOME:-$HOME/.codex}"; export PWCLI="$CODEX_HOME/skills/playwright/scripts/playwright_cli.sh"`
2. `"$PWCLI" open http://127.0.0.1:5174/admin/servers --headed`
3. `"$PWCLI" snapshot`
4. `"$PWCLI" screenshot output/playwright/servers-after.png`

Current environment blocker:

- Browser launch/dependency failure (`libatk-1.0.so.0` missing / Chrome dependency resolution failure).  
- E2E/screenshot evidence cannot be captured until host browser deps are installed.
