#!/usr/bin/env bash
set -euo pipefail

cd /opt/vpn-suite

./manage.sh up-core
./manage.sh up-monitoring

require() {
  local name="$1"
  local url="$2"
  local ok_re="${3:-^2..$}"
  echo "check: $name ($url)" >&2
  for _ in $(seq 1 30); do
    code="$(curl -sS --max-time 3 -o /dev/null -w '%{http_code}' "$url" || true)"
    if echo "$code" | grep -Eq "$ok_re"; then
      return 0
    fi
    sleep 2
  done
  echo "FAILED: $name ($url)" >&2
  return 1
}

require "admin-api health" "http://127.0.0.1:8000/health"
require "prometheus ready" "http://127.0.0.1:19090/-/ready"
require "loki ready" "http://127.0.0.1:3100/ready"
require "tempo ready" "http://127.0.0.1:3200/ready"
require "grafana health" "http://127.0.0.1:3000/api/health"
require "alertmanager ready" "http://127.0.0.1:19093/-/ready" '^(2..|401)$'

# Generate a couple spans.
curl -fsS --max-time 5 "http://127.0.0.1:8000/health" >/dev/null
curl -fsS --max-time 5 "http://127.0.0.1:8000/api/v1/overview/health-snapshot" >/dev/null || true

# Assert Tempo metrics endpoint responds.
python3 - <<'PY'
import urllib.request

text = urllib.request.urlopen("http://127.0.0.1:3200/metrics", timeout=5).read().decode("utf-8", errors="replace")
if "tempo_build_info" not in text:
    raise SystemExit("tempo metrics missing build info")
print("ok tempo_metrics")
PY

echo "ok observability smoke" >&2

