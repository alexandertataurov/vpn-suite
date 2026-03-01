#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

command -v docker >/dev/null 2>&1 || { echo "docker not found" >&2; exit 1; }
command -v curl >/dev/null 2>&1 || { echo "curl not found" >&2; exit 1; }
command -v python3 >/dev/null 2>&1 || { echo "python3 not found" >&2; exit 1; }

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
REDIS_CONTAINER="${REDIS_CONTAINER:-vpn-suite-redis-1}"
FAILOVER_NODE="${FAILOVER_NODE:-amnezia-awg}"
ALT_NODE="${ALT_NODE:-amnezia-awg2}"

step() {
  echo
  echo "==> $*"
}

clear_login_rate_limit_keys() {
  if docker ps --format '{{.Names}}' | grep -q "^${REDIS_CONTAINER}$"; then
    mapfile -t keys < <(docker exec "$REDIS_CONTAINER" redis-cli --scan --pattern 'ratelimit:login:*' || true)
    for k in "${keys[@]}"; do
      docker exec "$REDIS_CONTAINER" redis-cli DEL "$k" >/dev/null || true
    done
    echo "Cleared ${#keys[@]} login rate-limit key(s)"
  fi
}

cleanup() {
  docker unpause "$FAILOVER_NODE" >/dev/null 2>&1 || true
}
trap cleanup EXIT

step "Preflight containers"
for c in "$FAILOVER_NODE" "$ALT_NODE"; do
  if ! docker ps --format '{{.Names}}' | grep -q "^${c}$"; then
    echo "Required container '${c}' is not running"
    exit 1
  fi
done

docker exec "$FAILOVER_NODE" wg show interfaces >/dev/null

docker exec "$ALT_NODE" wg show interfaces >/dev/null

echo "Containers ready: $FAILOVER_NODE, $ALT_NODE"

clear_login_rate_limit_keys

step "Baseline multi-node topology"
SMOKE_USER_ID="$SMOKE_USER_ID" SMOKE_TG_ID="$SMOKE_TG_ID" SMOKE_PLAN_ID="$SMOKE_PLAN_ID" SMOKE_SUBSCRIPTION_ID="$SMOKE_SUBSCRIPTION_ID" FAILOVER_NODE="$FAILOVER_NODE" ALT_NODE="$ALT_NODE" python3 - <<'PY'
import json
import os
import urllib.error
import urllib.request

BASE = "http://127.0.0.1:8000"
EMAIL = os.environ["ADMIN_EMAIL"]
PASSWORD = os.environ["ADMIN_PASSWORD"]
FAILOVER_NODE = os.environ["FAILOVER_NODE"]
ALT_NODE = os.environ["ALT_NODE"]


def req(method: str, path: str, body=None, headers=None):
    h = {"Content-Type": "application/json"}
    if headers:
        h.update(headers)
    data = None if body is None else json.dumps(body).encode()
    r = urllib.request.Request(BASE + path, data=data, method=method, headers=h)
    try:
        with urllib.request.urlopen(r, timeout=30) as resp:
            raw = resp.read().decode()
            return resp.status, (json.loads(raw) if raw else {})
    except urllib.error.HTTPError as e:
        raw = e.read().decode()
        return e.code, (json.loads(raw) if raw else {})


def must(method: str, path: str, expected: int, body=None, headers=None):
    status, payload = req(method, path, body, headers)
    if status != expected:
        raise SystemExit(f"{method} {path} expected {expected}, got {status}: {payload}")
    return payload

login = must("POST", "/api/v1/auth/login", 200, {"email": EMAIL, "password": PASSWORD})
headers = {"Authorization": f"Bearer {login['access_token']}"}
must("POST", "/api/v1/cluster/scan", 200, {}, headers)
topo = must("GET", "/api/v1/cluster/topology", 200, None, headers)

nodes = [
    {
        "container_name": n.get("container_name"),
        "node_id": n.get("node_id"),
        "status": n.get("status"),
        "interface_name": n.get("interface_name"),
    }
    for n in topo.get("nodes", [])
]
print(json.dumps(nodes, indent=2))

names = {n["container_name"] for n in nodes}
if FAILOVER_NODE not in names or ALT_NODE not in names:
    raise SystemExit(f"Expected both nodes in topology: {FAILOVER_NODE}, {ALT_NODE}; got {sorted(names)}")
PY

step "Pause failover node"
docker pause "$FAILOVER_NODE" >/dev/null
echo "Paused: $FAILOVER_NODE"

clear_login_rate_limit_keys

step "Failover scheduling check"
SMOKE_USER_ID="$SMOKE_USER_ID" SMOKE_TG_ID="$SMOKE_TG_ID" SMOKE_PLAN_ID="$SMOKE_PLAN_ID" SMOKE_SUBSCRIPTION_ID="$SMOKE_SUBSCRIPTION_ID" FAILOVER_NODE="$FAILOVER_NODE" ALT_NODE="$ALT_NODE" python3 - <<'PY'
import json
import os
import time
import datetime as dt
import urllib.error
import urllib.request

BASE = "http://127.0.0.1:8000"
EMAIL = os.environ["ADMIN_EMAIL"]
PASSWORD = os.environ["ADMIN_PASSWORD"]
USER_ID_ENV = (os.environ.get("SMOKE_USER_ID") or "").strip()
TG_ID_ENV = (os.environ.get("SMOKE_TG_ID") or "").strip()
PLAN_ID_ENV = (os.environ.get("SMOKE_PLAN_ID") or "").strip()
SUB_ID_ENV = (os.environ.get("SMOKE_SUBSCRIPTION_ID") or "").strip()
FAILOVER_NODE = os.environ["FAILOVER_NODE"]
ALT_NODE = os.environ["ALT_NODE"]


def req(method: str, path: str, body=None, headers=None):
    h = {"Content-Type": "application/json"}
    if headers:
        h.update(headers)
    data = None if body is None else json.dumps(body).encode()
    r = urllib.request.Request(BASE + path, data=data, method=method, headers=h)
    try:
        with urllib.request.urlopen(r, timeout=30) as resp:
            raw = resp.read().decode()
            return resp.status, (json.loads(raw) if raw else {})
    except urllib.error.HTTPError as e:
        raw = e.read().decode()
        return e.code, (json.loads(raw) if raw else {})


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
        {"tg_id": tg_id, "meta": {"purpose": "smoke-ha", "ts": int(time.time())}},
        headers,
    )
    if status == 201 and isinstance(payload, dict) and payload.get("id"):
        return int(payload["id"])
    if status == 409:
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
        {"name": "Smoke Plan", "duration_days": 30, "price_currency": "USD", "price_amount": "0"},
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
    created = must(
        "POST",
        "/api/v1/subscriptions",
        201,
        {
            "user_id": user_id,
            "plan_id": plan_id,
            "valid_from": now.isoformat(),
            "valid_until": (now + dt.timedelta(days=30)).isoformat(),
            "device_limit": 1,
        },
        headers,
    )
    if not created.get("id"):
        raise SystemExit(f"POST /api/v1/subscriptions returned unexpected payload: {created}")
    return created["id"]

login = must("POST", "/api/v1/auth/login", 200, {"email": EMAIL, "password": PASSWORD})
headers = {"Authorization": f"Bearer {login['access_token']}"}
must("POST", "/api/v1/cluster/scan", 200, {}, headers)
topo = must("GET", "/api/v1/cluster/topology", 200, None, headers)

node_by_id = {n.get("node_id"): n.get("container_name") for n in topo.get("nodes", [])}
status_by_name = {n.get("container_name"): n.get("status") for n in topo.get("nodes", [])}
print(json.dumps([
    {
        "container_name": n.get("container_name"),
        "node_id": n.get("node_id"),
        "status": n.get("status"),
        "interface_name": n.get("interface_name"),
        "peer_count": n.get("peer_count"),
    }
    for n in topo.get("nodes", [])
], indent=2))

if status_by_name.get(FAILOVER_NODE) == "healthy":
    raise SystemExit(f"Paused node {FAILOVER_NODE} unexpectedly healthy: {status_by_name}")

# Clear active devices using degraded override to avoid stale peer reset failures.
USER_ID = get_or_create_user_id(headers)
PLAN_ID = get_or_create_plan_id(headers)
SUB_ID = get_or_create_subscription_id(USER_ID, PLAN_ID, headers)

status, devices = req("GET", f"/api/v1/users/{USER_ID}/devices", None, headers)
if status != 200:
    raise SystemExit(f"GET devices failed: {status} {devices}")
for item in devices.get("items", []):
    if item.get("revoked_at") is None:
        rs, rp = req("POST", f"/api/v1/devices/{item['id']}/reset", {"force_revoke_db_only": True}, headers)
        if rs not in (200, 409):
            raise SystemExit(f"Forced reset failed for {item['id']}: {rs} {rp}")

peer = must(
    "POST",
    "/api/v1/wg/peer",
    201,
    {
        "user_id": USER_ID,
        "subscription_id": SUB_ID,
        "device_name": f"ha-failover-{int(time.time())}",
    },
    headers,
)
if peer.get("node_mode") != "real" or not peer.get("peer_created"):
    raise SystemExit(f"/wg/peer did not provision runtime peer: {peer}")

selected = node_by_id.get(peer.get("server_id"), "unknown")
print(json.dumps({
    "selected_server_id": peer.get("server_id"),
    "selected_container": selected,
    "node_mode": peer.get("node_mode"),
    "peer_created": peer.get("peer_created"),
}, indent=2))

if selected != ALT_NODE:
    raise SystemExit(
        f"Failover scheduling mismatch: expected {ALT_NODE}, got {selected} (server_id={peer.get('server_id')})"
    )

resync = must("POST", "/api/v1/cluster/resync", 200, {}, headers)
print(json.dumps({"nodes_reconciled": resync.get("nodes_reconciled")}, indent=2))
PY

step "Restore paused node"
docker unpause "$FAILOVER_NODE" >/dev/null
echo "Unpaused: $FAILOVER_NODE"

clear_login_rate_limit_keys

step "Post-recovery topology"
SMOKE_USER_ID="$SMOKE_USER_ID" SMOKE_TG_ID="$SMOKE_TG_ID" SMOKE_PLAN_ID="$SMOKE_PLAN_ID" SMOKE_SUBSCRIPTION_ID="$SMOKE_SUBSCRIPTION_ID" FAILOVER_NODE="$FAILOVER_NODE" ALT_NODE="$ALT_NODE" python3 - <<'PY'
import json
import os
import urllib.error
import urllib.request

BASE = "http://127.0.0.1:8000"
EMAIL = os.environ["ADMIN_EMAIL"]
PASSWORD = os.environ["ADMIN_PASSWORD"]
FAILOVER_NODE = os.environ["FAILOVER_NODE"]
ALT_NODE = os.environ["ALT_NODE"]


def req(method: str, path: str, body=None, headers=None):
    h = {"Content-Type": "application/json"}
    if headers:
        h.update(headers)
    data = None if body is None else json.dumps(body).encode()
    r = urllib.request.Request(BASE + path, data=data, method=method, headers=h)
    try:
        with urllib.request.urlopen(r, timeout=30) as resp:
            raw = resp.read().decode()
            return resp.status, (json.loads(raw) if raw else {})
    except urllib.error.HTTPError as e:
        raw = e.read().decode()
        return e.code, (json.loads(raw) if raw else {})


def must(method: str, path: str, expected: int, body=None, headers=None):
    status, payload = req(method, path, body, headers)
    if status != expected:
        raise SystemExit(f"{method} {path} expected {expected}, got {status}: {payload}")
    return payload

login = must("POST", "/api/v1/auth/login", 200, {"email": EMAIL, "password": PASSWORD})
headers = {"Authorization": f"Bearer {login['access_token']}"}
must("POST", "/api/v1/cluster/scan", 200, {}, headers)
topo = must("GET", "/api/v1/cluster/topology", 200, None, headers)

nodes = [
    {
        "container_name": n.get("container_name"),
        "status": n.get("status"),
        "interface_name": n.get("interface_name"),
    }
    for n in topo.get("nodes", [])
]
print(json.dumps(nodes, indent=2))

names = {n["container_name"] for n in nodes}
if FAILOVER_NODE not in names or ALT_NODE not in names:
    raise SystemExit(f"Expected recovered topology with both nodes; got {sorted(names)}")
PY

echo
echo "Staging HA failover smoke completed successfully."
