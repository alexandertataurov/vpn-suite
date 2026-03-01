#!/usr/bin/env bash
set -euo pipefail
IFS=$'\n\t'

PROM_URL="${PROM_URL:-http://127.0.0.1:19090}"

need() { command -v "$1" >/dev/null 2>&1 || { echo "missing dependency: $1" >&2; exit 1; }; }
need curl
need python3

umask 077
tmpdir="$(mktemp -d)"
trap 'rm -rf "$tmpdir"' EXIT

fail() { echo "FAIL: $*" >&2; exit 1; }

query() {
  local q="$1"
  local tmpq="$tmpdir/query.json"
  curl -sS --max-time 5 "${PROM_URL}/api/v1/query?query=${q}" -o "$tmpq" || true
  python3 - <<PY
import json,sys
raw=open("${tmpq}","r",encoding="utf-8").read()
if not raw.strip():
    print(""); sys.exit(0)
try:
    data=json.loads(raw)
except json.JSONDecodeError:
    print(""); sys.exit(0)
if data.get("status")!="success":
    print(""); sys.exit(0)
result=data.get("data",{}).get("result",[])
print(json.dumps(result))
PY
}

echo "Checking Prometheus targets..."
tmp="$tmpdir/targets.json"
curl -sS --max-time 5 "${PROM_URL}/api/v1/targets?state=any" -o "$tmp"
python3 - <<PY
import json,sys
raw=open("${tmp}","r",encoding="utf-8").read()
if not raw.strip():
    print("targets empty"); sys.exit(1)
try:
    data=json.loads(raw)
except json.JSONDecodeError:
    print("targets invalid json"); print(raw[:200]); sys.exit(1)
active=data.get("data",{}).get("activeTargets",[])
def health(job):
    for t in active:
        if t.get("labels",{}).get("job")==job:
            return t.get("health")
    return None
for job in ["wg-exporter"]:
    h=health(job)
    print(f"{job} health={h}")
PY

echo "Checking wireguard metrics..."
wg_up=$(query "wireguard_up")
[[ -n "${wg_up}" && "${wg_up}" != "[]" ]] || fail "wireguard_up missing"
wg_peers=$(query "wireguard_peers")
[[ -n "${wg_peers}" && "${wg_peers}" != "[]" ]] || fail "wireguard_peers missing"

echo "OK: wireguard metrics present"
