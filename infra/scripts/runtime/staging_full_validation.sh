#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

command -v docker >/dev/null 2>&1 || { echo "docker not found" >&2; exit 1; }
command -v curl >/dev/null 2>&1 || { echo "curl not found" >&2; exit 1; }
command -v python3 >/dev/null 2>&1 || { echo "python3 not found" >&2; exit 1; }
command -v rg >/dev/null 2>&1 || { echo "rg not found" >&2; exit 1; }

ENV_FILE="${ENV_FILE:-}"
source scripts/lib/env.sh
resolve_env_file
load_env_file "$ENV_FILE"

: "${ADMIN_EMAIL:?ADMIN_EMAIL is required (ENV_FILE=$ENV_FILE)}"
: "${ADMIN_PASSWORD:?ADMIN_PASSWORD is required (ENV_FILE=$ENV_FILE)}"

# Optional overrides for deterministic smoke. If unset, the smoke will auto-provision
# an internal test user/subscription via admin APIs.
SMOKE_USER_ID="${SMOKE_USER_ID:-}"
SMOKE_TG_ID="${SMOKE_TG_ID:-9999999999}"
SMOKE_PLAN_ID="${SMOKE_PLAN_ID:-}"
SMOKE_SUBSCRIPTION_ID="${SMOKE_SUBSCRIPTION_ID:-}"
CLEAR_LOGIN_RATE_LIMIT="${CLEAR_LOGIN_RATE_LIMIT:-1}"
REDIS_CONTAINER="${REDIS_CONTAINER:-vpn-suite-redis-1}"
RUN_HA_FAILOVER_SMOKE="${RUN_HA_FAILOVER_SMOKE:-0}"
SMOKE_INJECT_AGENT_HEARTBEAT="${SMOKE_INJECT_AGENT_HEARTBEAT:-0}"

step() {
  echo
  echo "==> $*"
}

clear_login_rate_limit_keys() {
  [[ "$CLEAR_LOGIN_RATE_LIMIT" == "1" ]] || return 0
  step "Clearing login rate-limit keys in Redis"
  if docker ps --format '{{.Names}}' | grep -q "^${REDIS_CONTAINER}\$"; then
    mapfile -t keys < <(docker exec "$REDIS_CONTAINER" redis-cli --scan --pattern 'ratelimit:login:*' || true)
    for k in "${keys[@]}"; do
      docker exec "$REDIS_CONTAINER" redis-cli DEL "$k" >/dev/null || true
    done
    echo "Cleared ${#keys[@]} key(s)"
  else
    echo "Redis container '${REDIS_CONTAINER}' not running; skipping key cleanup"
  fi
}

clear_login_rate_limit_keys

step "Backend tests"
(
  cd apps/admin-api
  NODE_MODE=mock TELEGRAM_STARS_WEBHOOK_SECRET="" pytest -q
)

step "Bot tests"
(cd apps/telegram-bot && pytest -q)

step "Frontend shared tests"
(cd "$ROOT_DIR/../.." && npm test -- --run)

step "Frontend build"
(cd "$ROOT_DIR/../.." && npm run build)

clear_login_rate_limit_keys

step "Admin Playwright E2E"
(
  cd apps/admin-web
  ADMIN_EMAIL="$ADMIN_EMAIL" ADMIN_PASSWORD="$ADMIN_PASSWORD" npx playwright test
)

clear_login_rate_limit_keys

step "Authenticated control-plane smoke"
if [[ "$SMOKE_INJECT_AGENT_HEARTBEAT" == "1" ]]; then
  step "Clearing cached topology in Redis (for injected agent heartbeat)"
  if docker ps --format '{{.Names}}' | grep -q "^${REDIS_CONTAINER}\$"; then
    docker exec "$REDIS_CONTAINER" redis-cli DEL vpn:topology:current vpn:topology:version vpn:topology:hash >/dev/null || true
    echo "Topology cache cleared."
  else
    echo "Redis container '${REDIS_CONTAINER}' not running; skipping topology cache clear"
  fi
fi
SMOKE_USER_ID="$SMOKE_USER_ID" SMOKE_TG_ID="$SMOKE_TG_ID" SMOKE_PLAN_ID="$SMOKE_PLAN_ID" SMOKE_SUBSCRIPTION_ID="$SMOKE_SUBSCRIPTION_ID" SMOKE_INJECT_AGENT_HEARTBEAT="$SMOKE_INJECT_AGENT_HEARTBEAT" python3 - <<'PY'
import json
import os
import time
import datetime as dt
import urllib.error
import urllib.request

BASE = "http://127.0.0.1:8000"
USER_ID_ENV = (os.environ.get("SMOKE_USER_ID") or "").strip()
TG_ID_ENV = (os.environ.get("SMOKE_TG_ID") or "").strip()
PLAN_ID_ENV = (os.environ.get("SMOKE_PLAN_ID") or "").strip()
SUB_ID_ENV = (os.environ.get("SMOKE_SUBSCRIPTION_ID") or "").strip()
INJECT_HB = (os.environ.get("SMOKE_INJECT_AGENT_HEARTBEAT") or "").strip() == "1"
AGENT_TOKEN = (os.environ.get("AGENT_SHARED_TOKEN") or "").strip()
EMAIL = os.environ["ADMIN_EMAIL"]
PASSWORD = os.environ["ADMIN_PASSWORD"]


def req(method: str, path: str, body=None, headers=None):
    h = {"Content-Type": "application/json"}
    if headers:
        h.update(headers)
    data = None if body is None else json.dumps(body).encode()
    r = urllib.request.Request(BASE + path, data=data, method=method, headers=h)
    try:
        with urllib.request.urlopen(r, timeout=30) as resp:
            return resp.status, json.loads(resp.read().decode())
    except urllib.error.HTTPError as e:
        return e.code, json.loads(e.read().decode())


def must(method: str, path: str, expected: int, body=None, headers=None):
    status, payload = req(method, path, body, headers)
    if status != expected:
        raise SystemExit(f"{method} {path} expected {expected}, got {status}: {payload}")
    return payload


def get_or_create_user_id(headers: dict) -> int:
    if USER_ID_ENV:
        user_id = int(USER_ID_ENV)
        must("GET", f"/api/v1/users/{user_id}", 200, None, headers)
        return user_id

    tg_id = int(TG_ID_ENV) if TG_ID_ENV else 9999999999
    status, payload = req(
        "POST",
        "/api/v1/users",
        {"tg_id": tg_id, "meta": {"purpose": "smoke-staging", "ts": int(time.time())}},
        headers,
    )
    if status == 201 and isinstance(payload, dict) and payload.get("id"):
        return int(payload["id"])
    if status == 409:
        # Exists; resolve via by-tg.
        resolved = must("GET", f"/api/v1/users/by-tg/{tg_id}", 200, None, headers)
        if not resolved.get("id"):
            raise SystemExit(f"GET /api/v1/users/by-tg/{tg_id} returned unexpected payload: {resolved}")
        return int(resolved["id"])
    raise SystemExit(f"POST /api/v1/users unexpected status {status}: {payload}")


def get_or_create_plan_id(headers: dict) -> str:
    if PLAN_ID_ENV:
        plan_id = PLAN_ID_ENV
        must("GET", f"/api/v1/plans/{plan_id}", 200, None, headers)
        return plan_id

    status, payload = req("GET", "/api/v1/plans?limit=1&offset=0", None, headers)
    if status == 200 and isinstance(payload, dict) and payload.get("items"):
        return payload["items"][0]["id"]

    created = must(
        "POST",
        "/api/v1/plans",
        201,
        {
            "name": "Smoke Plan",
            "duration_days": 30,
            "price_currency": "USD",
            "price_amount": "0",
        },
        headers,
    )
    if not created.get("id"):
        raise SystemExit(f"POST /api/v1/plans returned unexpected payload: {created}")
    return created["id"]


def _parse_dt(v: str) -> dt.datetime | None:
    try:
        return dt.datetime.fromisoformat(v.replace("Z", "+00:00"))
    except Exception:
        return None


def get_or_create_subscription_id(user_id: int, plan_id: str, headers: dict) -> str:
    if SUB_ID_ENV:
        sub_id = SUB_ID_ENV
        must("GET", f"/api/v1/subscriptions/{sub_id}", 200, None, headers)
        return sub_id

    # Reuse an existing active subscription for this user/plan if present.
    now = dt.datetime.now(dt.timezone.utc)
    status, payload = req("GET", f"/api/v1/subscriptions?user_id={user_id}&limit=50&offset=0", None, headers)
    if status == 200 and isinstance(payload, dict):
        for item in payload.get("items", []):
            if item.get("plan_id") != plan_id:
                continue
            if item.get("status") != "active":
                continue
            until_raw = item.get("valid_until")
            until = _parse_dt(until_raw) if isinstance(until_raw, str) else None
            if until and until > now:
                return item["id"]

    valid_from = now
    valid_until = now + dt.timedelta(days=30)
    created = must(
        "POST",
        "/api/v1/subscriptions",
        201,
        {
            "user_id": user_id,
            "plan_id": plan_id,
            "valid_from": valid_from.isoformat(),
            "valid_until": valid_until.isoformat(),
            "device_limit": 1,
        },
        headers,
    )
    if not created.get("id"):
        raise SystemExit(f"POST /api/v1/subscriptions returned unexpected payload: {created}")
    return created["id"]


health_status, health = req("GET", "/health", None, None)
if health_status != 200:
    raise SystemExit(f"/health failed: {health_status} {health}")
node_mode = (health or {}).get("node_mode") or ""
print(f"node_mode={node_mode}")

login = must("POST", "/api/v1/auth/login", 200, {"email": EMAIL, "password": PASSWORD})
headers = {"Authorization": f"Bearer {login['access_token']}"}

# Auto-provision smoke user/subscription unless explicitly overridden.
USER_ID = get_or_create_user_id(headers)
PLAN_ID = get_or_create_plan_id(headers)
SUB_ID = get_or_create_subscription_id(USER_ID, PLAN_ID, headers)

# Preflight: in agent discovery, placement requires at least one eligible node.
# We check server registry first (does not touch topology cache). Optionally inject a synthetic agent
# heartbeat for local-only smoke when no node-agent is connected.
srv_status, srv_payload = req("GET", "/api/v1/servers?limit=200&offset=0", None, headers)
if srv_status != 200:
    raise SystemExit(f"GET /api/v1/servers failed: {srv_status} {srv_payload}")
servers = srv_payload.get("items", []) if isinstance(srv_payload, dict) else []
active_servers = [s for s in servers if s.get("is_active") is True]
if not active_servers and not INJECT_HB:
    raise SystemExit(
        "No active servers available for placement (all servers are is_active=false). "
        "Fix: register/activate nodes and ensure node-agent heartbeats match server_id. "
        "Hint: run ./manage.sh seed-nodes (NODE_1_API_ENDPOINT...) and configure node-agent SERVER_ID to the server.id. "
        "Local-only workaround: re-run with SMOKE_INJECT_AGENT_HEARTBEAT=1."
    )

if INJECT_HB:
    if not AGENT_TOKEN:
        raise SystemExit("SMOKE_INJECT_AGENT_HEARTBEAT=1 requires AGENT_SHARED_TOKEN in ENV_FILE")
    if not servers:
        raise SystemExit("SMOKE_INJECT_AGENT_HEARTBEAT=1: no servers in DB to attach heartbeat to")
    target = active_servers[0] if active_servers else servers[0]
    target_id = target.get("id")
    if not target_id:
        raise SystemExit(f"SMOKE_INJECT_AGENT_HEARTBEAT=1: unexpected server payload: {target}")
    # Ensure server is eligible for discovery.
    if not target.get("is_active"):
        ps, pp = req("PATCH", f"/api/v1/servers/{target_id}", {"is_active": True}, headers)
        if ps != 200:
            raise SystemExit(f"Failed to activate server {target_id}: {ps} {pp}")
    now = dt.datetime.now(dt.timezone.utc).isoformat()
    hb_body = {
        "server_id": target_id,
        "container_name": str(target.get("name") or "smoke-node"),
        "interface_name": "awg0",
        "public_key": str(target.get("public_key") or ""),
        "listen_port": 0,
        "peer_count": 0,
        "total_rx_bytes": 0,
        "total_tx_bytes": 0,
        "health_score": 1.0,
        "status": "healthy",
        "agent_version": "smoke",
        "ts_utc": now,
    }
    hs, hp = req("POST", "/api/v1/agent/heartbeat", hb_body, {"X-Agent-Token": AGENT_TOKEN})
    if hs != 200:
        raise SystemExit(f"Injected agent heartbeat failed: {hs} {hp}")

# Free user slot (if any active devices) so /wg/peer check is deterministic.
s, devices = req("GET", f"/api/v1/users/{USER_ID}/devices", None, headers)
if s == 200:
    for item in devices.get("items", []):
        if item.get("revoked_at") is None:
            req("POST", f"/api/v1/devices/{item['id']}/reset", {}, headers)

checks = [("GET", "/api/v1/cluster/topology", None)]
expected = {("GET", "/api/v1/cluster/topology"): 200}

# Agent-mode is the production target: cluster scan/resync are intentionally disabled.
if node_mode in ("mock", "real"):
    checks.insert(0, ("POST", "/api/v1/cluster/scan", {}))
    expected[("POST", "/api/v1/cluster/scan")] = 200

checks.append(
    (
        "POST",
        "/api/v1/wg/peer",
        {
            "user_id": USER_ID,
            "subscription_id": SUB_ID,
            "device_name": f"staging-validation-{int(time.time())}",
        },
    )
)
expected[("POST", "/api/v1/wg/peer")] = 201

if node_mode in ("mock", "real"):
    checks.append(("POST", "/api/v1/cluster/resync", {}))
    expected[("POST", "/api/v1/cluster/resync")] = 200

for method, path, body in checks:
    s, payload = req(method, path, body, headers)
    print(f"{method} {path} -> {s}")
    if s != expected[(method, path)]:
        raise SystemExit(f"unexpected status for {method} {path}: {s} {payload}")
    if path == "/api/v1/wg/peer":
        if payload.get("node_mode") != node_mode:
            raise SystemExit(f"/wg/peer returned unexpected node_mode: {payload}")
        if not payload.get("device_id") or not payload.get("config") or not payload.get("server_id"):
            raise SystemExit(f"/wg/peer returned unexpected payload: {payload}")
        if node_mode == "real" and not payload.get("peer_created"):
            raise SystemExit(f"/wg/peer did not provision runtime peer: {payload}")
        if node_mode == "agent" and payload.get("peer_created") not in (False, None):
            raise SystemExit(f"/wg/peer should be DB-only in agent mode: {payload}")
        print(json.dumps(
            {
                "server_id": payload.get("server_id"),
                "node_mode": payload.get("node_mode"),
                "peer_created": payload.get("peer_created"),
            },
            indent=2,
        ))
    elif path == "/api/v1/cluster/topology":
        nodes = payload.get("nodes", [])
        print(json.dumps(
            [
                {
                    "container_name": n.get("container_name"),
                    "interface_name": n.get("interface_name"),
                    "status": n.get("status"),
                    "peer_count": n.get("peer_count"),
                }
                for n in nodes
            ],
            indent=2,
        ))
    else:
        print(json.dumps(payload, indent=2)[:1200])
PY

step "Metrics presence check"
curl -fsS http://127.0.0.1:8000/metrics \
  | rg -n "^vpn_nodes_total|^vpn_node_health|^vpn_node_interface_info|^vpn_peers_total|^vpn_cluster_load_index|^bot_conversion_rate"

if [[ "$RUN_HA_FAILOVER_SMOKE" == "1" ]]; then
  step "HA failover smoke"
  bash scripts/staging_ha_failover_smoke.sh
fi

echo
echo "Staging full validation completed successfully."
