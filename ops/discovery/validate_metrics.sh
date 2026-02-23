#!/usr/bin/env bash
set -euo pipefail

PROM_URL="${PROM_URL:-http://127.0.0.1:19090}"

fail() {
  echo "FAIL: $*" >&2
  exit 1
}

query() {
  local q="$1"
  local tmpq
  tmpq="$(mktemp)"
  curl -sS "${PROM_URL}/api/v1/query?query=${q}" -o "${tmpq}"
  python3 - <<PY
import json,sys
raw=open("${tmpq}","r",encoding="utf-8").read()
if not raw.strip():
    print("")
    sys.exit(0)
try:
    data=json.loads(raw)
except json.JSONDecodeError:
    print("")
    sys.exit(0)
if data.get("status")!="success":
    print("")
    sys.exit(0)
result=data.get("data",{}).get("result",[])
print(json.dumps(result))
PY
  rm -f "${tmpq}"
}

echo "Checking Prometheus targets..."
tmp="$(mktemp)"
trap 'rm -f "${tmp}"' EXIT
curl -sS "${PROM_URL}/api/v1/targets?state=any" -o "${tmp}"
python3 - <<PY
import json,sys
raw=open("${tmp}","r",encoding="utf-8").read()
if not raw.strip():
    print("targets empty")
    sys.exit(1)
try:
    data=json.loads(raw)
except json.JSONDecodeError:
    print("targets invalid json")
    print(raw[:200])
    sys.exit(1)
active=data.get("data",{}).get("activeTargets",[])
def health(job):
    for t in active:
        if t.get("labels",{}).get("job")==job:
            return t.get("health")
    return None
for job in ["outline-poller","outline-ss","wg-exporter"]:
    h=health(job)
    print(f"{job} health={h}")
PY

echo "Checking outline metrics..."
outline=$(query "outline_access_keys_total")
if [[ -z "${outline}" || "${outline}" == "[]" ]]; then
  fail "outline_access_keys_total missing"
fi

echo "Checking wireguard metrics..."
wg_up=$(query "wireguard_up")
if [[ -z "${wg_up}" || "${wg_up}" == "[]" ]]; then
  fail "wireguard_up missing"
fi

wg_peers=$(query "wireguard_peers")
if [[ -z "${wg_peers}" || "${wg_peers}" == "[]" ]]; then
  fail "wireguard_peers missing"
fi

echo "OK: outline + wireguard metrics present"
