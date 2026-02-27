#!/usr/bin/env bash
# VPN Suite — single interface for ops (see .cursor/skills/vpn-suite/SKILL.md)
set -e
cd "$(dirname "$0")"

# Single source of truth for env (override with ENV_FILE=... if needed).
ENV_FILE="${ENV_FILE:-.env}"
# Pass ENV_FILE into Compose interpolation (used by docker-compose.yml env_file anchors).
# Auto-detect DOCKER_GID for node-agent socket access if unset.
if [ -z "${DOCKER_GID:-}" ]; then
  _gid=$(getent group docker 2>/dev/null | cut -d: -f3)
  [ -n "$_gid" ] && export DOCKER_GID="$_gid"
fi
DC=(env ENV_FILE="$ENV_FILE" docker compose --env-file "$ENV_FILE")
DC_OBS=(env ENV_FILE="$ENV_FILE" docker compose -f docker-compose.yml -f docker-compose.observability.yml --env-file "$ENV_FILE")

cmd="${1:-}"
case "$cmd" in
  config)
    echo "WARNING: config expands .env (secrets may appear). Do not run in shared CI logs." >&2
    "${DC[@]}" config
    ;;
  config-validate)
    "${DC[@]}" config > /dev/null && echo "Config valid."
    ;;
  build)
    "${DC[@]}" build admin-api
    ;;
  build-bot)
    "${DC[@]}" build telegram-vpn-bot
    ;;
  up-api)
    # Start only admin-api (uses ENV_FILE so required vars e.g. GRAFANA_ADMIN_PASSWORD are set)
    "${DC[@]}" up -d admin-api
    ;;
  up-core)
    # admin-api, admin-worker (telemetry/snapshot), postgres, redis, reverse-proxy (Caddy for $PUBLIC_DOMAIN)
    "${DC[@]}" up -d postgres redis
    "${DC[@]}" run --rm admin-api python -m alembic upgrade head
    # Bootstrap idempotent seeds (admin user and optional plans from env).
    "${DC[@]}" run --rm admin-api python scripts/seed_admin.py
    "${DC[@]}" run --rm admin-api python scripts/seed_plans.py
    "${DC[@]}" run --rm admin-api python scripts/seed_system_operator.py
    "${DC[@]}" up -d admin-api admin-worker
    bash scripts/update_admin_api_ip.sh
    "${DC[@]}" up -d reverse-proxy telegram-vpn-bot
    ;;
  up-monitoring)
    # Guardrail: fail fast when Prometheus host port is occupied by another service.
    PROM_PORT="${PROMETHEUS_HOST_PORT:-19090}"
    if command -v ss >/dev/null 2>&1; then
      if ss -lnt "( sport = :$PROM_PORT )" | tail -n +2 | grep -q .; then
        if ! docker ps --format '{{.Names}} {{.Ports}}' | grep -q "vpn-suite-prometheus-1 .*127.0.0.1:$PROM_PORT->9090/tcp"; then
          echo "Port 127.0.0.1:$PROM_PORT is already in use; set PROMETHEUS_HOST_PORT to a free port in $ENV_FILE and retry." >&2
          exit 1
        fi
      fi
    fi
    if [ -z "${OTEL_TRACES_ENDPOINT:-}" ]; then
      export OTEL_TRACES_ENDPOINT="otel-collector:4317"
    fi
    "${DC_OBS[@]}" --profile monitoring up -d admin-api telegram-vpn-bot
    "${DC_OBS[@]}" --profile monitoring up -d victoria-metrics prometheus alertmanager cadvisor node-exporter loki promtail grafana discovery-runner wg-exporter tempo otel-collector
    ;;
  down-core)
    "${DC[@]}" down --remove-orphans
    ;;
  down-monitoring)
    "${DC_OBS[@]}" --profile monitoring stop victoria-metrics prometheus alertmanager cadvisor node-exporter loki promtail grafana discovery-runner wg-exporter tempo otel-collector
    ;;
  restart-metrics)
    # Restart admin-worker (telemetry/snapshot), then full monitoring stack so Prometheus re-scrapes.
    "${DC[@]}" restart admin-worker 2>/dev/null || "${DC[@]}" up -d admin-worker
    "${DC_OBS[@]}" --profile monitoring stop victoria-metrics prometheus alertmanager cadvisor node-exporter loki promtail grafana discovery-runner wg-exporter tempo otel-collector 2>/dev/null || true
    "${DC_OBS[@]}" --profile monitoring up -d admin-api telegram-vpn-bot
    "${DC_OBS[@]}" --profile monitoring up -d victoria-metrics prometheus alertmanager cadvisor node-exporter loki promtail grafana discovery-runner wg-exporter tempo otel-collector
    sleep 3
    curl -sS -X POST "http://127.0.0.1:${PROMETHEUS_HOST_PORT:-19090}/-/reload" 2>/dev/null || true
    echo "Metrics stack restarted. Admin UI metrics need admin-worker (telemetry) + Prometheus scraping admin-api."
    ;;
  restart-audit)
    # Use only docker-compose.audit.yml so port 18001 is used (no merge with base 8000).
    AUDIT_PROJECT="${AUDIT_PROJECT:-vpn-suite-audit}"
    docker compose -p "$AUDIT_PROJECT" -f docker-compose.audit.yml --env-file "${ENV_FILE:-.env}" down --remove-orphans 2>/dev/null || true
    docker compose -p "$AUDIT_PROJECT" -f docker-compose.audit.yml --env-file "${ENV_FILE:-.env}" up -d postgres redis
    docker compose -p "$AUDIT_PROJECT" -f docker-compose.audit.yml --env-file "${ENV_FILE:-.env}" run --rm admin-api python -m alembic upgrade head 2>/dev/null || true
    docker compose -p "$AUDIT_PROJECT" -f docker-compose.audit.yml --env-file "${ENV_FILE:-.env}" up -d admin-api reverse-proxy
    echo "Audit stack restarted."
    ;;
  ps)
    "${DC[@]}" ps
    ;;
  logs)
    "${DC[@]}" logs -f "${2:-}"
    ;;
  logs-monitoring)
    "${DC_OBS[@]}" --profile monitoring logs -f "${2:-prometheus}"
    ;;
  migrate)
    "${DC[@]}" run --rm admin-api python -m alembic upgrade head
    ;;
  seed)
    "${DC[@]}" run --rm admin-api python scripts/seed_admin.py
    ;;
  seed-plans)
    "${DC[@]}" run --rm admin-api python scripts/seed_plans.py
    ;;
  seed-nodes)
    "${DC[@]}" run --rm -e PYTHONPATH=/app admin-api python scripts/seed_servers.py
    ;;
  seed-agent-server)
    # Create one Server for agent mode; print its id. Then set SERVER_ID=<that id> in node-agent env.
    SERVER_ID="${AGENT_SERVER_ID:-vpn-node-1}"
    echo "Creating or confirming server id=$SERVER_ID ..." >&2
    "${DC[@]}" run --rm -e PYTHONPATH=/app -e AGENT_SERVER_ID="$SERVER_ID" admin-api python scripts/seed_agent_server.py
    echo "Set in your node-agent env: SERVER_ID=$SERVER_ID" >&2
    ;;
  up-agent)
    # Start node-agent (profile: agent). Requires: client certs (run scripts/generate-agent-client-cert.sh), core stack up, AmneziaWG container.
    # DOCKER_GID auto-detected from host if not set so agent can access /var/run/docker.sock.
    "${DC[@]}" --profile agent up -d --build node-agent
    ;;
  bootstrap)
    # One-command bring-up: core + agent server seed + node-agent. Idempotent.
    ROOT="$(cd "$(dirname "$0")" && pwd)"
    if [ ! -f "$ROOT/secrets/agent_client_cert.pem" ] && [ -f "$ROOT/scripts/generate-agent-client-cert.sh" ]; then
      echo "Agent client certs missing; running scripts/generate-agent-client-cert.sh ..." >&2
      bash "$ROOT/scripts/generate-agent-client-cert.sh" || { echo "Fix certs (need secrets/agent_ca.pem and key) then re-run bootstrap." >&2; exit 1; }
    fi
    echo "Bringing up core stack..." >&2
    "${DC[@]}" up -d postgres redis
    "${DC[@]}" run --rm admin-api python -m alembic upgrade head
    "${DC[@]}" run --rm admin-api python scripts/seed_admin.py
    "${DC[@]}" run --rm admin-api python scripts/seed_plans.py
    "${DC[@]}" run --rm admin-api python scripts/seed_system_operator.py
    bash scripts/update_admin_api_ip.sh
    "${DC[@]}" up -d admin-api reverse-proxy telegram-vpn-bot
    echo "Seeding agent server (id=${AGENT_SERVER_ID:-vpn-node-1})..." >&2
    "${DC[@]}" run --rm -e PYTHONPATH=/app -e AGENT_SERVER_ID="${AGENT_SERVER_ID:-vpn-node-1}" admin-api python scripts/seed_agent_server.py
    echo "Starting node-agent..." >&2
    "${DC[@]}" --profile agent up -d --build node-agent
    echo "Bootstrap done. Servers: ./manage.sh ps" >&2
    ;;
  seed-operator)
    "${DC[@]}" run --rm admin-api python scripts/seed_system_operator.py
    ;;
  openapi)
    (cd backend && python3 scripts/export_openapi.py)
    ;;
  backup-db)
    bash ops/db_dump.sh
    ;;
  restore-db)
    shift
    bash ops/db_restore.sh "$@"
    ;;
  build-admin)
    (cd frontend && npm run build:admin)
    ;;
  build-webapp)
    # Do not "source" env files directly: values may contain spaces.
    source scripts/lib/env.sh
    resolve_env_file
    load_env_file "$ENV_FILE"
    (cd frontend && npm run build:miniapp)
    ;;
  build-storybook)
    (cd frontend/shared && npm run build-storybook)
    ;;
  node-sync)
    "${DC[@]}" run --rm -e PYTHONPATH=/app admin-api python scripts/node_ops.py sync
    ;;
  node-resync)
    "${DC[@]}" run --rm -e PYTHONPATH=/app admin-api python scripts/node_ops.py resync
    ;;
  node-list)
    "${DC[@]}" run --rm -e PYTHONPATH=/app admin-api python scripts/node_ops.py list
    ;;
  node-check)
    [ -z "${2:-}" ] && echo "Usage: $0 node-check <server_id>" >&2 && exit 1
    "${DC[@]}" run --rm -e PYTHONPATH=/app admin-api python scripts/node_ops.py check "$2"
    ;;
  node-restart)
    [ -z "${2:-}" ] && echo "Usage: $0 node-restart <server_id>" >&2 && exit 1
    echo "node-restart is not supported in docker runtime control-plane." >&2
    exit 1
    ;;
  node-telemetry)
    [ -z "${2:-}" ] && echo "Usage: $0 node-telemetry <server_id>" >&2 && exit 1
    "${DC[@]}" run --rm -e PYTHONPATH=/app admin-api python scripts/node_ops.py telemetry "$2"
    ;;
  node-limits-apply)
    [ -z "${2:-}" ] && echo "Usage: $0 node-limits-apply <server_id> [traffic_gb] [speed_mbps] [max_connections]" >&2 && exit 1
    "${DC[@]}" run --rm -e PYTHONPATH=/app admin-api python scripts/node_ops.py limits-apply "$2" "${3:-}" "${4:-}" "${5:-}"
    ;;
  node-undrain)
    [ -z "${2:-}" ] && echo "Usage: $0 node-undrain <server_id>" >&2 && exit 1
    "${DC[@]}" run --rm -e PYTHONPATH=/app admin-api python scripts/node_ops.py undrain "$2"
    ;;
  node-public-key)
    [ -z "${2:-}" ] && echo "Usage: $0 node-public-key <server_id> [public_key]" >&2 && exit 1
    "${DC[@]}" run --rm -e PYTHONPATH=/app ${SERVER_PUBLIC_KEY:+-e SERVER_PUBLIC_KEY="$SERVER_PUBLIC_KEY"} admin-api python scripts/node_ops.py public-key "$2" "${3:-}"
    ;;
  fix-server-public-key)
    # Sync servers so DB gets correct Server.public_key from node; optional reissue all devices on a server.
    "${DC[@]}" run --rm -e PYTHONPATH=/app admin-api python scripts/fix_server_public_key.py ${2:+$2}
    ;;
  node-kill-no-peers)
    bash "$(dirname "$0")/scripts/kill-amnezia-wg-no-peers.sh"
    ;;
  install-nat-service)
    # Install systemd unit so NAT (10.8.1.0/24, 10.66.66.0/24) is applied after reboot.
    SVC=amnezia-nat-setup.service
    if [ ! -f "ops/systemd/$SVC" ]; then
      echo "ops/systemd/$SVC not found." >&2
      exit 1
    fi
    sudo cp "ops/systemd/$SVC" /etc/systemd/system/ &&
      sudo systemctl daemon-reload &&
      sudo systemctl enable "$SVC" &&
      echo "Enabled $SVC. Run: sudo systemctl start $SVC  # apply NAT now"
    ;;
  smoke-staging)
    # Full staging validation (tests + build + e2e + authenticated API smoke).
    bash scripts/staging_full_validation.sh
    ;;
  smoke-ha)
    # HA/failover smoke only (expects FAILOVER_NODE + ALT_NODE containers on the host).
    bash scripts/staging_ha_failover_smoke.sh
    ;;
  smoke-staging-ha)
    # Full validation + HA/failover smoke.
    RUN_HA_FAILOVER_SMOKE=1 bash scripts/staging_full_validation.sh
    ;;
  test-stand)
    # VPN connection config test stand (debug logs). Optional: TEST_STAND_LOG=path, TEST_STAND_ISSUE=1 (issue check, needs DB).
    "${DC[@]}" run --rm -e PYTHONPATH=/app admin-api python scripts/test_stand_vpn_config.py --no-env \
      ${TEST_STAND_LOG:+--log-file "$TEST_STAND_LOG"} ${TEST_STAND_ISSUE:+--issue} 2>&1
    ;;
  sanity-check)
    # Sanity-check control-plane mode vs running agents to avoid mixed ownership of peers.
    source scripts/lib/env.sh
    resolve_env_file
    load_env_file "$ENV_FILE"
    ERR=0
    NODE_DISCOVERY_VAL="${NODE_DISCOVERY:-}"
    NODE_MODE_VAL="${NODE_MODE:-}"
    if [ "$NODE_DISCOVERY_VAL" = "docker" ] && docker ps --format '{{.Names}}' | grep -q '^node-agent'; then
      echo "ERROR: node-agent container is running while NODE_DISCOVERY=docker. Stop node-agent or switch NODE_DISCOVERY=agent/NODE_MODE=agent." >&2
      ERR=1
    fi
    if [ "$NODE_DISCOVERY_VAL" = "docker" ] && [ "$NODE_MODE_VAL" != "real" ]; then
      echo "ERROR: NODE_DISCOVERY=docker requires NODE_MODE=real (single-host/dev mode)." >&2
      ERR=1
    fi
    if [ "$NODE_DISCOVERY_VAL" = "agent" ] && [ "$NODE_MODE_VAL" != "agent" ]; then
      echo "ERROR: NODE_DISCOVERY=agent requires NODE_MODE=agent." >&2
      ERR=1
    fi
    if [ "$ERR" -ne 0 ]; then
      exit 1
    fi
    echo "Sanity check OK: control-plane configuration is consistent."
    ;;
  check)
    # Quick quality gate: ruff, pytest, frontend lint/typecheck/test/build (no migrate; use verify for full).
    bash scripts/quality_gate.sh
    ;;
  verify)
    # Full quality gate: lint, typecheck, unit tests, build, migrate integrity, config-validate (no API/E2E; use smoke-staging for full).
    bash scripts/verify.sh
    ;;
  *)
    echo "Usage: $0 {config|config-validate|build|...|install-nat-service|test-stand|check|verify|smoke-staging|smoke-ha|smoke-staging-ha}" >&2
    exit 1
    ;;
esac
