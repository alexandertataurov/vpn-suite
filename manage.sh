#!/usr/bin/env bash
# VPN Suite — single interface for ops (see .cursor/skills/vpn-suite/SKILL.md)
# Disk freeing: never use "docker system prune --volumes" or remove *_postgres_data / *_redis_data; preserve DB and app data.
set -euo pipefail
IFS=$'\n\t'
cd "$(dirname "$0")"

STRICT="${STRICT:-0}"
FAILED_SUBSYSTEMS=()

ts() { date -u +"%Y-%m-%dT%H:%M:%SZ"; }
log() { printf '%s [%s] %s\n' "$(ts)" "$1" "$2" >&2; }
die() { log ERROR "$1"; exit 1; }

usage() {
  cat >&2 <<'USAGE'
Usage: ./manage.sh <cmd>
See README.md for: up-core, down-core, up-monitoring, bootstrap, rebuild-restart, restart-admin, build-all, migrate, seed*, node-*, restore-devices-from-peers, server:verify, server:sync, server:reconcile, server:drift, device:reissue, support-bundle, setup-backend-venv, check, verify, docs-check, pre-deploy-smoke, pre-deploy-verify, smoke-staging, config, config-validate, build, build-admin, build-webapp, backup-db, backup-monitoring, restore-db, openapi, ps, logs.
STRICT=1 makes optional failures fatal.
USAGE
}

# Optional steps: label + command. On failure: print stderr (last 30 lines), record label, exit 1 if STRICT=1.
_optional() {
  local label="$1"
  shift
  _OPTIONAL_ERRF="${TMPDIR:-/tmp}/optional-$$.err"
  trap 'rm -f "${_OPTIONAL_ERRF:-}"' RETURN
  if ! "$@" 2> "$_OPTIONAL_ERRF"; then
    log WARN "Optional step failed (${label}): $*"
    log WARN "stderr (last 30 lines):"
    [[ -f "${_OPTIONAL_ERRF:-}" ]] && tail -n 30 "$_OPTIONAL_ERRF" >&2 || true
    FAILED_SUBSYSTEMS+=("$label")
    if [[ "$STRICT" == "1" ]]; then
      exit 1
    fi
    return 0
  fi
}

_subsystem_summary() {
  local audit_ok=1 obs_ok=1 agent_ok=1
  local s
  for s in "${FAILED_SUBSYSTEMS[@]}"; do
    [[ "$s" == "audit" ]] && audit_ok=0
    [[ "$s" == "observability" ]] && obs_ok=0
    [[ "$s" == "agent" ]] && agent_ok=0
  done
  log INFO "---"
  log INFO "core up"
  [[ $audit_ok -eq 1 ]] && log INFO "audit up" || log WARN "audit failed (see stderr above)"
  [[ $obs_ok -eq 1 ]] && log INFO "observability up" || log WARN "observability failed (see stderr above)"
  [[ $agent_ok -eq 1 ]] && log INFO "agent up" || log WARN "agent failed (see stderr above)"
  if [[ "$STRICT" == "1" && ${#FAILED_SUBSYSTEMS[@]} -gt 0 ]]; then
    exit 1
  fi
}

ENV_FILE="${ENV_FILE:-.env}"
[[ -f "$ENV_FILE" ]] || die "ENV_FILE not found: $ENV_FILE"
COMPOSE_PROJECT_NAME="${COMPOSE_PROJECT_NAME:-vpn-suite}"

# Pass ENV_FILE into Compose interpolation (used by infra/compose/docker-compose.yml env_file anchors).
# Auto-detect DOCKER_GID for node-agent socket access if unset.
if [[ -z "${DOCKER_GID:-}" ]]; then
  _gid="$(getent group docker 2>/dev/null | cut -d: -f3 || true)"
  [[ -n "${_gid:-}" ]] && export DOCKER_GID="$_gid"
fi

DC=(env ENV_FILE="$ENV_FILE" COMPOSE_PROJECT_NAME="$COMPOSE_PROJECT_NAME" docker compose -f infra/compose/docker-compose.yml --env-file "$ENV_FILE" --profile docker-telemetry)
DC_OBS=(env ENV_FILE="$ENV_FILE" COMPOSE_PROJECT_NAME="$COMPOSE_PROJECT_NAME" docker compose -f infra/compose/docker-compose.yml -f infra/compose/docker-compose.observability.yml --env-file "$ENV_FILE" --profile docker-telemetry)
AUDIT_PROJECT="${AUDIT_PROJECT:-vpn-suite-audit}"
DC_AUDIT=(env ENV_FILE="$ENV_FILE" COMPOSE_PROJECT_NAME="$AUDIT_PROJECT" docker compose -p "$AUDIT_PROJECT" -f infra/compose/docker-compose.audit.yml --env-file "$ENV_FILE")
MONITORING_SERVICES=(victoria-metrics prometheus alertmanager cadvisor node-exporter loki promtail grafana discovery-runner wg-exporter tempo otel-collector)

_safe_disk_cleanup() {
  log INFO "Safe disk cleanup (images, build cache). Volumes unchanged."
  docker system prune -af
  docker builder prune -af
}

_backup_postgres_before_risky() {
  if [[ "${BACKUP_SKIP:-0}" == "1" ]]; then return 0; fi
  if ! "${DC[@]}" ps -q postgres 2>/dev/null | grep -q .; then
    log INFO "Postgres not running; skipping pre-down backup."
    return 0
  fi
  log INFO "Running backup-db before risky operation..."
  _optional "backup-db" bash infra/scripts/ops/db_dump.sh
}

run_seeds() {
  "${DC[@]}" run --rm admin-api python scripts/seed_admin.py
  "${DC[@]}" run --rm admin-api python scripts/seed_plans.py
  "${DC[@]}" run --rm admin-api python scripts/seed_system_operator.py
}

build_all_images() {
  "${DC[@]}" build admin-api admin-worker reverse-proxy telegram-vpn-bot
  _optional "audit" "${DC_AUDIT[@]}" build admin-api telegram-vpn-bot
  _optional "observability" "${DC_OBS[@]}" build discovery-runner wg-exporter
}

run_node_ops() {
  "${DC[@]}" run --rm -e PYTHONPATH=/app ${SERVER_PUBLIC_KEY:+-e SERVER_PUBLIC_KEY="$SERVER_PUBLIC_KEY"} \
    admin-api python scripts/node_ops.py "$@"
}

cmd="${1:-}"
case "$cmd" in
  config)
    if [[ "${ALLOW_ENV_OUTPUT:-0}" != "1" ]]; then
      log ERROR "Refusing to print expanded config. Set ALLOW_ENV_OUTPUT=1 to proceed."
      exit 1
    fi
    "${DC[@]}" config
    ;;
  config-validate)
    "${DC[@]}" config > /dev/null && log INFO "Config valid."
    ;;
  build)
    "${DC[@]}" build admin-api
    ;;
  build-all)
    build_all_images
    ;;
  restart-admin)
    # Safe: rebuild admin UI + admin-api + reverse-proxy only. Never touches postgres or down.
    _safe_disk_cleanup
    npm run build:admin
    "${DC[@]}" build admin-api
    "${DC[@]}" up -d --force-recreate admin-api reverse-proxy
    log INFO "Admin API and reverse-proxy restarted. DB unchanged."
    ;;
  rebuild-restart)
    FAILED_SUBSYSTEMS=()
    log WARN "This runs 'down --remove-orphans'. DB volumes are preserved (no -v). Set BACKUP_SKIP=1 to skip auto-backup."
    _safe_disk_cleanup
    _backup_postgres_before_risky
    build_all_images
    "${DC[@]}" down --remove-orphans
    "${DC[@]}" up -d postgres redis
    "${DC[@]}" run --rm admin-api python -m alembic upgrade head
    run_seeds
    "${DC[@]}" up -d admin-api admin-worker
    bash infra/scripts/runtime/update_admin_api_ip.sh
    "${DC[@]}" up -d reverse-proxy telegram-vpn-bot
    _optional "audit" "${DC_AUDIT[@]}" down --remove-orphans
    _optional "audit" "${DC_AUDIT[@]}" up -d postgres redis
    _optional "audit" "${DC_AUDIT[@]}" run --rm admin-api python -m alembic upgrade head
    _optional "audit" "${DC_AUDIT[@]}" up -d admin-api reverse-proxy
    _optional "observability" "${DC_OBS[@]}" --profile monitoring stop "${MONITORING_SERVICES[@]}"
    "${DC_OBS[@]}" --profile monitoring up -d admin-api telegram-vpn-bot
    "${DC_OBS[@]}" --profile monitoring up -d "${MONITORING_SERVICES[@]}"
    _subsystem_summary
    ;;
  build-bot)
    "${DC[@]}" build telegram-vpn-bot
    ;;
  up-api)
    # Start only admin-api (uses ENV_FILE so required vars e.g. GRAFANA_ADMIN_PASSWORD are set)
    "${DC[@]}" up -d admin-api
    ;;
  up-core)
    "${DC[@]}" up -d --remove-orphans postgres redis
    "${DC[@]}" run --rm admin-api python -m alembic upgrade head
    run_seeds
    "${DC[@]}" up -d admin-api admin-worker
    bash infra/scripts/runtime/update_admin_api_ip.sh
    "${DC[@]}" up -d reverse-proxy telegram-vpn-bot
    ;;
  up-monitoring)
    # Guardrail: fail fast when Prometheus host port is occupied by another service.
    PROM_PORT="${PROMETHEUS_HOST_PORT:-19090}"
    if command -v ss >/dev/null 2>&1; then
      if ss -lnt "( sport = :$PROM_PORT )" | tail -n +2 | grep -q .; then
        if ! docker ps --format '{{.Names}} {{.Ports}}' | grep -q "vpn-suite-prometheus-1 .*127.0.0.1:$PROM_PORT->9090/tcp"; then
          die "Port 127.0.0.1:$PROM_PORT is already in use; set PROMETHEUS_HOST_PORT to a free port in $ENV_FILE and retry."
        fi
      fi
    fi
    if [[ -z "${OTEL_TRACES_ENDPOINT:-}" ]]; then
      export OTEL_TRACES_ENDPOINT="otel-collector:4317"
    fi
    "${DC_OBS[@]}" --profile monitoring up -d admin-api telegram-vpn-bot
    "${DC_OBS[@]}" --profile monitoring up -d "${MONITORING_SERVICES[@]}"
    ;;
  down-core)
    # Never use -v here; postgres_data and redis_data must persist.
    _backup_postgres_before_risky
    "${DC[@]}" down --remove-orphans
    ;;
  down-monitoring)
    "${DC_OBS[@]}" --profile monitoring stop "${MONITORING_SERVICES[@]}"
    ;;
  free-space)
    # Reclaim disk without touching any volumes (never remove DB or app data).
    docker system prune -af
    docker builder prune -af
    log INFO "Freed space (images, build cache). Volumes unchanged."
    ;;
  restart-metrics)
    FAILED_SUBSYSTEMS=()
    if ! "${DC[@]}" restart admin-worker 2>/dev/null; then "${DC[@]}" up -d admin-worker; fi
    _optional "observability" "${DC_OBS[@]}" --profile monitoring stop "${MONITORING_SERVICES[@]}"
    "${DC_OBS[@]}" --profile monitoring up -d admin-api telegram-vpn-bot
    "${DC_OBS[@]}" --profile monitoring up -d "${MONITORING_SERVICES[@]}"
    sleep 3
    _optional "observability" curl -sS -X POST "http://127.0.0.1:${PROMETHEUS_HOST_PORT:-19090}/-/reload"
    _subsystem_summary
    ;;
  restart-audit)
    FAILED_SUBSYSTEMS=()
    _optional "audit" "${DC_AUDIT[@]}" down --remove-orphans
    "${DC_AUDIT[@]}" up -d postgres redis
    _optional "audit" "${DC_AUDIT[@]}" run --rm admin-api python -m alembic upgrade head
    "${DC_AUDIT[@]}" up -d admin-api reverse-proxy
    _subsystem_summary
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
    SERVER_ID="${AGENT_SERVER_ID:-vpn-node-1}"
    log INFO "Creating or confirming server id=$SERVER_ID ..."
    "${DC[@]}" run --rm -e PYTHONPATH=/app -e AGENT_SERVER_ID="$SERVER_ID" admin-api python scripts/seed_agent_server.py
    log INFO "Set in your node-agent env: SERVER_ID=$SERVER_ID"
    ;;
  up-agent)
    # Start node-agent (profile: agent). Requires: client certs (run infra/scripts/pki/generate-agent-client-cert.sh), core stack up, AmneziaWG container.
    # DOCKER_GID auto-detected from host if not set so agent can access /var/run/docker.sock.
    "${DC[@]}" --profile agent up -d --build node-agent
    ;;
  bootstrap)
    FAILED_SUBSYSTEMS=()
    ROOT="$(cd "$(dirname "$0")" && pwd)"
    if [[ ! -f "$ROOT/secrets/agent_client_cert.pem" ]] && [[ -f "$ROOT/infra/scripts/pki/generate-agent-client-cert.sh" ]]; then
      log INFO "Agent client certs missing; running infra/scripts/pki/generate-agent-client-cert.sh ..."
      bash "$ROOT/infra/scripts/pki/generate-agent-client-cert.sh" || { die "Fix certs (need secrets/agent_ca.pem and key) then re-run bootstrap."; }
    fi
    log INFO "Bringing up core stack..."
    "${DC[@]}" up -d postgres redis
    "${DC[@]}" run --rm admin-api python -m alembic upgrade head
    run_seeds
    bash infra/scripts/runtime/update_admin_api_ip.sh
    "${DC[@]}" up -d admin-api reverse-proxy telegram-vpn-bot
    log INFO "Seeding agent server (id=${AGENT_SERVER_ID:-vpn-node-1})..."
    "${DC[@]}" run --rm -e PYTHONPATH=/app -e AGENT_SERVER_ID="${AGENT_SERVER_ID:-vpn-node-1}" admin-api python scripts/seed_agent_server.py
    log INFO "Starting node-agent..."
    _optional "agent" "${DC[@]}" --profile agent up -d --build node-agent
    _subsystem_summary
    ;;
  seed-operator)
    "${DC[@]}" run --rm admin-api python scripts/seed_system_operator.py
    ;;
  openapi)
    (cd apps/admin-api && python3 scripts/export_openapi.py)
    ;;
  docs-check)
    python3 tools/quality/validate_docs.py
    ;;
  backup-db)
    bash infra/scripts/ops/db_dump.sh
    ;;
  backup-monitoring)
    bash infra/scripts/ops/backup_monitoring.sh
    ;;
  restore-db)
    shift
    bash infra/scripts/ops/db_restore.sh "$@"
    ;;
  build-admin)
    npm run build:admin
    ;;
  build-webapp)
    # Do not "source" env files directly: values may contain spaces.
    source scripts/lib/env.sh
    resolve_env_file
    load_env_file "$ENV_FILE"
    npm run build:miniapp
    ;;
  build-storybook)
    (cd apps/admin-web && npm run build-storybook)
    ;;
  node-sync)
    run_node_ops sync
    ;;
  node-resync)
    run_node_ops resync
    ;;
  node-list)
    run_node_ops list
    ;;
  node-check)
    [[ -z "${2:-}" ]] && { log ERROR "Usage: $0 node-check <server_id>"; exit 1; }
    run_node_ops check "$2"
    ;;
  node-telemetry)
    [[ -z "${2:-}" ]] && { log ERROR "Usage: $0 node-telemetry <server_id>"; exit 1; }
    run_node_ops telemetry "$2"
    ;;
  node-limits-apply)
    [[ -z "${2:-}" ]] && { log ERROR "Usage: $0 node-limits-apply <server_id> [traffic_gb] [speed_mbps] [max_connections]"; exit 1; }
    run_node_ops limits-apply "$2" "${3:-}" "${4:-}" "${5:-}"
    ;;
  node-undrain)
    [[ -z "${2:-}" ]] && { log ERROR "Usage: $0 node-undrain <server_id>"; exit 1; }
    run_node_ops undrain "$2"
    ;;
  node-public-key)
    [[ -z "${2:-}" ]] && { log ERROR "Usage: $0 node-public-key <server_id> [public_key]"; exit 1; }
    run_node_ops public-key "$2" "${3:-}"
    ;;
  restore-devices-from-peers)
    "${DC[@]}" run --rm -e PYTHONPATH=/app -v "$(pwd)/apps/admin-api:/app:ro" admin-api python scripts/restore_devices_from_peers.py "${@:2}"
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
    if [[ ! -f "infra/systemd/units/$SVC" ]]; then
      die "infra/systemd/units/$SVC not found."
    fi
    sudo cp "infra/systemd/units/$SVC" /etc/systemd/system/ &&
      sudo systemctl daemon-reload &&
      sudo systemctl enable "$SVC" &&
      log INFO "Enabled $SVC. Run: sudo systemctl start $SVC  # apply NAT now"
    ;;
  pre-deploy-smoke)
    # 2-minute smoke (check, health, login). See docs/ops/pre-deploy-checklist.md
    bash infra/scripts/runtime/pre_deploy_smoke.sh 2min
    ;;
  pre-deploy-verify)
    # 10-minute pre-release (verify, up-core, health, build, API smoke).
    bash infra/scripts/runtime/pre_deploy_smoke.sh 10min
    ;;
  smoke-staging)
    # Full staging validation (tests + build + e2e + authenticated API smoke).
    bash infra/scripts/runtime/staging_full_validation.sh
    ;;
  smoke-ha)
    # HA/failover smoke only (expects FAILOVER_NODE + ALT_NODE containers on the host).
    bash infra/scripts/runtime/staging_ha_failover_smoke.sh
    ;;
  smoke-staging-ha)
    # Full validation + HA/failover smoke.
    RUN_HA_FAILOVER_SMOKE=1 bash infra/scripts/runtime/staging_full_validation.sh
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
    if [[ "$NODE_DISCOVERY_VAL" = "docker" ]] && docker ps --format '{{.Names}}' | grep -q '^node-agent'; then
      log ERROR "node-agent is running while NODE_DISCOVERY=docker. Stop node-agent or switch NODE_DISCOVERY=agent/NODE_MODE=agent."
      ERR=1
    fi
    if [[ "$NODE_DISCOVERY_VAL" = "docker" ]] && [[ "$NODE_MODE_VAL" != "real" ]]; then
      log ERROR "NODE_DISCOVERY=docker requires NODE_MODE=real (single-host/dev mode)."
      ERR=1
    fi
    if [[ "$NODE_DISCOVERY_VAL" = "agent" ]] && [[ "$NODE_MODE_VAL" != "agent" ]]; then
      log ERROR "NODE_DISCOVERY=agent requires NODE_MODE=agent."
      ERR=1
    fi
    [[ "$ERR" -ne 0 ]] && exit 1
    log INFO "Sanity check OK: control-plane configuration is consistent."
    ;;
  setup-backend-venv)
    # Bootstrap pip in apps/admin-api .venv and install deps (use when .venv has no pip / pytest).
    cd apps/admin-api
    if [[ ! -x .venv/bin/python ]]; then
      die "No apps/admin-api/.venv found. Create it first: python -m venv apps/admin-api/.venv"
    fi
    if .venv/bin/python -c "import pytest" 2>/dev/null; then
      log INFO "Backend venv already has pytest. Nothing to do."
      exit 0
    fi
    log INFO "Bootstrapping pip and installing dev deps..."
    curl -sS https://bootstrap.pypa.io/get-pip.py -o /tmp/get-pip.py
    .venv/bin/python /tmp/get-pip.py -q
    .venv/bin/python -m pip install -q -r requirements.txt -r requirements-dev.txt
    log INFO "Backend venv ready. Run ./manage.sh check to validate."
    ;;
  check)
    # Quick quality gate: docs, ruff, pytest, frontend lint/typecheck/test/build (no migrate; use verify for full).
    bash tools/quality/quality_gate.sh
    ;;
  verify)
    # Full quality gate: docs, lint, typecheck, unit tests, build, migrate integrity, config-validate (no API/E2E; use smoke-staging for full).
    bash tools/quality/verify.sh
    ;;
  support-bundle)
    # Bounded logs, Redis agent keys, manifest. Optional: --output DIR.
    bash infra/scripts/runtime/support_bundle.sh "${@:2}"
    ;;
  server:verify)
    [[ -z "${2:-}" ]] && { log ERROR "Usage: $0 server:verify <server_id>"; exit 1; }
    run_node_ops check "$2"
    ;;
  server:sync)
    [[ -z "${2:-}" ]] && { log ERROR "Usage: $0 server:sync <server_id>"; exit 1; }
    "${DC[@]}" run --rm -e PYTHONPATH=/app admin-api python scripts/fix_server_public_key.py "$2"
    ;;
  server:reconcile)
    [[ -z "${2:-}" ]] && { log ERROR "Usage: $0 server:reconcile <server_id> [--dry-run]"; exit 1; }
    source scripts/lib/env.sh
    resolve_env_file
    load_env_file "$ENV_FILE"
    if [[ "${NODE_DISCOVERY:-}" == "agent" ]]; then
      bash "$(dirname "$0")/infra/scripts/runtime/call_admin_api.sh" create_action "$2" "apply_peers"
      exit 0
    fi
    run_node_ops reconcile "$2" ${3:+$3}
    ;;
  server:drift)
    [[ -z "${2:-}" ]] && { log ERROR "Usage: $0 server:drift <server_id>"; exit 1; }
    source scripts/lib/env.sh
    resolve_env_file
    load_env_file "$ENV_FILE"
    if [[ "${NODE_DISCOVERY:-}" == "agent" ]]; then
      log INFO "Desired state: DB (admin-api). Actual state: on node (node-agent). Check agent metrics (agent_peers_desired, agent_peers_runtime) or node-agent logs."
      exit 0
    fi
    run_node_ops reconcile "$2" --dry-run
    ;;
  device:reissue)
    [[ -z "${2:-}" ]] && { log ERROR "Usage: $0 device:reissue <device_id> (requires API_TOKEN or ADMIN_EMAIL/ADMIN_PASSWORD; blocks if server key unverified)"; exit 1; }
    bash "$(dirname "$0")/infra/scripts/runtime/call_admin_api.sh" reissue "$2"
    ;;
  *)
    usage
    exit 1
    ;;
esac
