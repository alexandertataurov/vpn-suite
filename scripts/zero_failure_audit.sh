#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

AUDIT_PROJECT="${AUDIT_PROJECT:-vpn-suite-audit}"
SOURCE_PG_CONTAINER="${SOURCE_PG_CONTAINER:-vpn-suite-postgres-1}"

BASE_API="${BASE_API:-http://127.0.0.1:18000}"
BASE_PROXY="${BASE_PROXY:-http://127.0.0.1:18080}"
BASE_BOT_HEALTH="${BASE_BOT_HEALTH:-http://127.0.0.1:18090/healthz}"

ENABLE_MONITORING="${ENABLE_MONITORING:-1}"
ENABLE_BOT="${ENABLE_BOT:-1}"

ENV_FILE="${ENV_FILE:-.env}"

if [[ ! -f "$ENV_FILE" ]]; then
  echo "ERROR: ENV_FILE not found: $ENV_FILE"
  exit 1
fi

load_env_file() {
  # Parse .env-like files safely (supports spaces in values, e.g. CIDR allowlists).
  # This is intentionally minimal: KEY=VALUE lines only.
  local file="$1"
  local line key val
  while IFS= read -r line || [[ -n "$line" ]]; do
    line="${line%$'\r'}"
    [[ -z "$line" ]] && continue
    [[ "$line" =~ ^[[:space:]]*# ]] && continue
    line="${line#export }"
    key="${line%%=*}"
    val="${line#*=}"
    # Trim whitespace in key
    key="${key#"${key%%[![:space:]]*}"}"
    key="${key%"${key##*[![:space:]]}"}"
    [[ -z "$key" || "$key" == "$line" ]] && continue
    # Strip surrounding quotes in value (common in env files)
    if [[ "$val" =~ ^\".*\"$ ]]; then
      val="${val:1:-1}"
    elif [[ "$val" =~ ^\'.*\'$ ]]; then
      val="${val:1:-1}"
    fi
    export "$key=$val"
  done < "$file"
}

load_env_file "$ENV_FILE"

: "${ADMIN_EMAIL:?ADMIN_EMAIL is required in ENV_FILE=$ENV_FILE}"
: "${ADMIN_PASSWORD:?ADMIN_PASSWORD is required in ENV_FILE=$ENV_FILE}"
: "${POSTGRES_USER:?POSTGRES_USER is required in ENV_FILE=$ENV_FILE}"
: "${POSTGRES_PASSWORD:?POSTGRES_PASSWORD is required in ENV_FILE=$ENV_FILE}"
: "${POSTGRES_DB:?POSTGRES_DB is required in ENV_FILE=$ENV_FILE}"

TIMESTAMP="$(date -u +%Y%m%dT%H%M%SZ)"
OUT_DIR="$ROOT_DIR/reports/zero-failure/$TIMESTAMP"
mkdir -p "$OUT_DIR"/{api,db,logs,playwright,scans}

RUN_LOG="$OUT_DIR/run.log"
if [[ "${QUIET:-0}" == "1" ]]; then
  exec >>"$RUN_LOG" 2>&1
else
  exec > >(tee -a "$RUN_LOG") 2>&1
fi

RUN_STARTED_ISO="$(date -u +%Y-%m-%dT%H:%M:%SZ)"

WATCH_PIDS=()

compose_audit() {
  env ENV_FILE="$ENV_FILE" docker compose --env-file "$ENV_FILE" \
    -p "$AUDIT_PROJECT" \
    -f docker-compose.audit.yml \
    "$@"
}

cleanup() {
  for pid in "${WATCH_PIDS[@]:-}"; do
    kill "$pid" >/dev/null 2>&1 || true
  done
}
trap cleanup EXIT

phase() { echo; echo "========== $* =========="; }

wait_http_200() {
  local url="$1"
  local max_wait="${2:-120}"
  local started
  started="$(date +%s)"
  while true; do
    code="$(curl -s -o /dev/null -w '%{http_code}' "$url" || true)"
    if [[ "$code" == "200" ]]; then
      return 0
    fi
    if (( "$(date +%s)" - started > max_wait )); then
      echo "Timeout waiting for $url (last code=$code)"
      return 1
    fi
    sleep 2
  done
}

phase "Audit Context"
echo "ENV_FILE=$ENV_FILE" | tee "$OUT_DIR/env_file.txt"
echo "AUDIT_PROJECT=$AUDIT_PROJECT" | tee -a "$OUT_DIR/env_file.txt"

phase "Build Frontend Assets"
if [[ "${SKIP_FRONTEND_BUILD:-0}" == "1" ]]; then
  echo "SKIP_FRONTEND_BUILD=1; skipping frontend build (using existing dist/ artifacts)."
else
  (cd frontend && npm run build)
fi

phase "Bring Up Isolated Audit Stack"
compose_audit down --remove-orphans || true
compose_audit --profile monitoring down --remove-orphans || true
compose_audit up -d postgres redis
compose_audit ps | tee "$OUT_DIR/compose_ps_initial.txt"

phase "Clone Source Postgres Into Audit Stack"
AUDIT_PG_CID="$(compose_audit ps -q postgres)"
if [[ -z "$AUDIT_PG_CID" ]]; then
  echo "ERROR: audit postgres container id not found"
  exit 1
fi
if docker ps --format '{{.Names}}' | grep -qx "$SOURCE_PG_CONTAINER"; then
  echo "Source postgres container found: $SOURCE_PG_CONTAINER"
  docker exec "$SOURCE_PG_CONTAINER" pg_dump \
    -U "$POSTGRES_USER" -d "$POSTGRES_DB" \
    --clean --if-exists --no-owner --no-privileges \
    > "$OUT_DIR/db/source_dump.sql"
  docker exec "$AUDIT_PG_CID" psql -v ON_ERROR_STOP=1 -U "$POSTGRES_USER" -d "$POSTGRES_DB" -c \
    "DROP SCHEMA IF EXISTS public CASCADE; CREATE SCHEMA public; GRANT ALL ON SCHEMA public TO $POSTGRES_USER; GRANT ALL ON SCHEMA public TO public;"
  cat "$OUT_DIR/db/source_dump.sql" | docker exec -i "$AUDIT_PG_CID" psql -v ON_ERROR_STOP=1 -U "$POSTGRES_USER" -d "$POSTGRES_DB"
  echo "DB clone restore completed."
else
  echo "WARNING: source postgres container '$SOURCE_PG_CONTAINER' not found; using fresh audit DB."
  echo "source container not found: $SOURCE_PG_CONTAINER" > "$OUT_DIR/db/clone_warning.txt"
fi

phase "Preflight: Migrations + Seeds"
# Build admin-api image once; avoid repeated builds during run/seed steps (saves time/memory).
compose_audit build admin-api
compose_audit run --rm admin-api python -m alembic upgrade head | tee "$OUT_DIR/db/migration.log"
compose_audit run --rm admin-api python scripts/seed_admin.py | tee "$OUT_DIR/db/seed_admin.log"
compose_audit run --rm admin-api python scripts/seed_plans.py | tee "$OUT_DIR/db/seed_plans.log"

docker exec "$AUDIT_PG_CID" psql -U "$POSTGRES_USER" -d "$POSTGRES_DB" -tAc \
  "select version_num from alembic_version" | tr -d '[:space:]' \
  > "$OUT_DIR/db/alembic_version.txt"
docker exec "$AUDIT_PG_CID" psql -U "$POSTGRES_USER" -d "$POSTGRES_DB" -tAc \
  "select to_regclass('public.docker_alerts')" | tr -d '[:space:]' \
  > "$OUT_DIR/db/docker_alerts_table.txt"

phase "Bring Up App Services (After DB Is Ready)"
compose_audit up -d admin-api reverse-proxy
if [[ "$ENABLE_BOT" == "1" ]]; then
  if [[ -z "${BOT_TOKEN_AUDIT:-}" ]]; then
    echo "WARNING: BOT_TOKEN_AUDIT is not set; disabling audit bot to avoid Telegram getUpdates conflicts." | tee "$OUT_DIR/bot_gate.txt"
    ENABLE_BOT="0"
  else
    compose_audit build telegram-vpn-bot
    compose_audit up -d telegram-vpn-bot
  fi
fi
if [[ "$ENABLE_MONITORING" == "1" ]]; then
  compose_audit --profile monitoring up -d prometheus cadvisor node-exporter loki promtail grafana || true
fi

wait_http_200 "$BASE_API/health" 180
wait_http_200 "$BASE_API/health/ready" 180
wait_http_200 "$BASE_PROXY/health" 180
if [[ "$ENABLE_BOT" == "1" ]]; then
  wait_http_200 "$BASE_BOT_HEALTH" 180
fi

phase "Start Parallel Log Watchers"
for svc in admin-api reverse-proxy postgres redis telegram-vpn-bot prometheus cadvisor node-exporter loki promtail grafana; do
  if compose_audit ps --services | grep -qx "$svc"; then
    compose_audit logs -f --since "$RUN_STARTED_ISO" --no-color "$svc" > "$OUT_DIR/logs/$svc.log" 2>&1 &
    WATCH_PIDS+=("$!")
  fi
done
echo "Started ${#WATCH_PIDS[@]} watcher(s)." | tee "$OUT_DIR/log_watchers.txt"

phase "Run Backend/Bot/Frontend Unit Tests"
BACKEND_TEST_EXIT=0
BOT_TEST_EXIT=0
FRONTEND_TEST_EXIT=0
(cd backend && NODE_MODE=mock NODE_DISCOVERY=agent pytest -q) \
  | tee "$OUT_DIR/backend_pytest.txt" || BACKEND_TEST_EXIT=$?
(cd bot && pytest -q) \
  | tee "$OUT_DIR/bot_pytest.txt" || BOT_TEST_EXIT=$?
(cd frontend && npm test -- --run) \
  | tee "$OUT_DIR/frontend_tests.txt" || FRONTEND_TEST_EXIT=$?
echo "$BACKEND_TEST_EXIT" > "$OUT_DIR/backend_test_exit_code.txt"
echo "$BOT_TEST_EXIT" > "$OUT_DIR/bot_test_exit_code.txt"
echo "$FRONTEND_TEST_EXIT" > "$OUT_DIR/frontend_test_exit_code.txt"

phase "Run API Audit"
python3 scripts/zero_failure_api_audit.py \
  --base-url "$BASE_API" \
  --out-dir "$OUT_DIR" \
  --admin-email "$ADMIN_EMAIL" \
  --admin-password "$ADMIN_PASSWORD" \
  --bot-api-key "${BOT_API_KEY:-}" \
  --webhook-secret "${TELEGRAM_STARS_WEBHOOK_SECRET:-}" \
  | tee "$OUT_DIR/api/stdout.json"

phase "Partial Dependency Outage Recovery"
PARTIAL_FILE="$OUT_DIR/api/partial_outage.json"
AUDIT_REDIS_CID="$(compose_audit ps -q redis)"
{
  echo "{"
  echo "  \"redis_pause\": {"
  docker stop "$AUDIT_REDIS_CID" >/dev/null
  REDIS_PAUSE_LOGIN_CODE="$(curl --connect-timeout 5 --max-time 15 -s -o /dev/null -w '%{http_code}' \
    -X POST "$BASE_API/api/v1/auth/login" \
    -H 'Content-Type: application/json' \
    -d "{\"email\":\"$ADMIN_EMAIL\",\"password\":\"$ADMIN_PASSWORD\"}" || true)"
  [[ "$REDIS_PAUSE_LOGIN_CODE" =~ ^[0-9]+$ ]] || REDIS_PAUSE_LOGIN_CODE=0
  docker start "$AUDIT_REDIS_CID" >/dev/null
  sleep 2
  echo "    \"login_status\": $((10#$REDIS_PAUSE_LOGIN_CODE))"
  echo "  },"
  echo "  \"postgres_pause\": {"
  docker stop "$AUDIT_PG_CID" >/dev/null
  PG_PAUSE_READY_CODE="$(curl --connect-timeout 5 --max-time 15 -s -o /dev/null -w '%{http_code}' "$BASE_API/health/ready" || true)"
  [[ "$PG_PAUSE_READY_CODE" =~ ^[0-9]+$ ]] || PG_PAUSE_READY_CODE=0
  docker start "$AUDIT_PG_CID" >/dev/null
  sleep 3
  PG_RECOVERY_READY_CODE="$(curl --connect-timeout 5 --max-time 15 -s -o /dev/null -w '%{http_code}' "$BASE_API/health/ready" || true)"
  [[ "$PG_RECOVERY_READY_CODE" =~ ^[0-9]+$ ]] || PG_RECOVERY_READY_CODE=0
  echo "    \"ready_while_paused\": $((10#$PG_PAUSE_READY_CODE)),"
  echo "    \"ready_after_recovery\": $((10#$PG_RECOVERY_READY_CODE))"
  echo "  }"
  echo "}"
} > "$PARTIAL_FILE"

phase "Run Admin Playwright E2E (Against Audit Proxy)"
PLAYWRIGHT_EXIT=0
(
  cd frontend/admin
  PLAYWRIGHT_NO_WEBSERVER=1 \
  PLAYWRIGHT_BASE_URL="$BASE_PROXY/admin/" \
  PLAYWRIGHT_API_BASE_URL="$BASE_PROXY/api/v1" \
  ADMIN_EMAIL="$ADMIN_EMAIL" \
  ADMIN_PASSWORD="$ADMIN_PASSWORD" \
  npx playwright test
) || PLAYWRIGHT_EXIT=$?
echo "$PLAYWRIGHT_EXIT" > "$OUT_DIR/playwright_exit_code.txt"
if [[ -d frontend/admin/playwright-report ]]; then
  cp -R frontend/admin/playwright-report "$OUT_DIR/playwright/playwright-report"
fi
if [[ -d frontend/admin/test-results ]]; then
  cp -R frontend/admin/test-results "$OUT_DIR/playwright/test-results"
fi

phase "Static Production Safety Scans"
rg -n --glob '!**/node_modules/**' 'console\.log\(' frontend/admin/src frontend/shared/src backend/app bot \
  > "$OUT_DIR/scans/console_log_hits.txt" || true
rg -n --glob '!**/node_modules/**' '(/debug|debug[_-]|test-only|__debug__)' backend/app frontend/admin/src bot \
  > "$OUT_DIR/scans/debug_surface_hits.txt" || true

if [[ -d frontend/admin/dist ]]; then
  rg -n 'SECRET_KEY|POSTGRES_PASSWORD|BOT_TOKEN|TELEGRAM_STARS_WEBHOOK_SECRET|DATABASE_URL|AGENT_SHARED_TOKEN' frontend/admin/dist \
    > "$OUT_DIR/scans/frontend_secret_leak_hits.txt" || true
fi
if [[ -d frontend/miniapp/dist ]]; then
  rg -n 'SECRET_KEY|POSTGRES_PASSWORD|BOT_TOKEN|TELEGRAM_STARS_WEBHOOK_SECRET|DATABASE_URL|AGENT_SHARED_TOKEN' frontend/miniapp/dist \
    > "$OUT_DIR/scans/miniapp_secret_leak_hits.txt" || true
fi

phase "Stop Log Watchers"
cleanup
WATCH_PIDS=()

phase "Log Pattern Surveillance"
python3 - "$OUT_DIR" <<'PY'
import csv
import re
import sys
from pathlib import Path

out_dir = Path(sys.argv[1])
log_dir = out_dir / "logs"
patterns = ["ERROR", "Unhandled", "Exception", "Timeout", "Rejected", "Traceback", "429", "500", "502", "503"]
compiled = {p: re.compile(rf"\b{re.escape(p)}\b") for p in patterns}

rows = []
hits_lines = []
for log_file in sorted(log_dir.glob("*.log")):
    text = log_file.read_text(encoding="utf-8", errors="replace")
    service = log_file.stem
    for p, rx in compiled.items():
        rows.append({"service": service, "pattern": p, "count": len(rx.findall(text))})
    for line in text.splitlines():
        if any(rx.search(line) for rx in compiled.values()):
            hits_lines.append(f"[{service}] {line}")

with (out_dir / "log_pattern_frequency.csv").open("w", encoding="utf-8", newline="") as f:
    w = csv.DictWriter(f, fieldnames=["service", "pattern", "count"])
    w.writeheader()
    w.writerows(rows)
(out_dir / "log_pattern_hits.txt").write_text("\n".join(hits_lines[:20000]), encoding="utf-8")
PY

phase "Merge Findings + Generate Final A-F Report"
python3 - "$OUT_DIR" <<'PY'
import json
import sys
from pathlib import Path

out_dir = Path(sys.argv[1])
summary_path = out_dir / "api" / "summary.json"
summary = json.loads(summary_path.read_text(encoding="utf-8"))
issues = list(summary.get("issues", []))
scenarios = dict(summary.get("scenarios", {}))
latency = summary.get("latency", {})

def add_issue(sev: str, title: str, details: str):
    issues.append({"severity": sev, "title": title, "details": details})

def file_nonempty(path: Path) -> bool:
    return path.exists() and path.stat().st_size > 0

playwright_exit = int((out_dir / "playwright_exit_code.txt").read_text().strip() or "0")
if playwright_exit != 0:
    add_issue("high", "Admin Playwright suite has failures", f"exit_code={playwright_exit}")

backend_test_exit = int((out_dir / "backend_test_exit_code.txt").read_text().strip() or "0")
bot_test_exit = int((out_dir / "bot_test_exit_code.txt").read_text().strip() or "0")
frontend_test_exit = int((out_dir / "frontend_test_exit_code.txt").read_text().strip() or "0")
if backend_test_exit != 0:
    add_issue("high", "Backend test suite has failures", f"exit_code={backend_test_exit}")
if bot_test_exit != 0:
    add_issue("high", "Bot test suite has failures", f"exit_code={bot_test_exit}")
if frontend_test_exit != 0:
    add_issue("high", "Frontend shared test suite has failures", f"exit_code={frontend_test_exit}")

partial = json.loads((out_dir / "api" / "partial_outage.json").read_text(encoding="utf-8"))
redis_login = int(partial["redis_pause"]["login_status"])
pg_recovery = int(partial["postgres_pause"]["ready_after_recovery"])
scenarios["14_partial_dependency_outage_recovery_behavior"] = {
    "passed": redis_login == 200 and pg_recovery == 200,
    "note": f"redis_login={redis_login} pg_ready_after_recovery={pg_recovery}",
    "executed": True,
}
if redis_login != 200:
    add_issue("high", "Redis partial-outage degraded auth path", f"login_status={redis_login}")
if pg_recovery != 200:
    add_issue("critical", "Postgres recovery failed after unpause", f"ready_after_recovery={pg_recovery}")

console_hits = (out_dir / "scans" / "console_log_hits.txt")
if file_nonempty(console_hits):
    add_issue("warning", "console.log present in code paths", f"hits={len(console_hits.read_text().splitlines())}")
debug_hits = (out_dir / "scans" / "debug_surface_hits.txt")
if file_nonempty(debug_hits):
    add_issue("warning", "Potential debug/test surface detected", f"hits={len(debug_hits.read_text().splitlines())}")

secret_hit_count = 0
for sf in [out_dir / "scans" / "frontend_secret_leak_hits.txt", out_dir / "scans" / "miniapp_secret_leak_hits.txt"]:
    if file_nonempty(sf):
        secret_hit_count += len(sf.read_text(encoding="utf-8", errors="replace").splitlines())
if secret_hit_count:
    add_issue("critical", "Potential secret/env leakage in frontend bundle", f"hits={secret_hit_count}")

freq_csv = out_dir / "log_pattern_frequency.csv"
unresolved = []
if freq_csv.exists():
    import csv
    with freq_csv.open("r", encoding="utf-8") as f:
        r = csv.DictReader(f)
        for row in r:
            cnt = int(row["count"])
            if cnt <= 0:
                continue
            if row["pattern"] in {"ERROR", "Unhandled", "Exception", "Traceback", "500"}:
                unresolved.append(f"{row['service']}:{row['pattern']}:{cnt}")
if unresolved:
    add_issue("high", "Critical log patterns detected in runtime logs", "; ".join(unresolved[:20]))

# Scenario 15: log sweep is "passed" only when no unresolved critical patterns.
scenarios["15_log_sweep_contains_no_unresolved_critical_patterns"] = {
    "passed": not unresolved,
    "note": "Log grep for mandatory patterns",
    "executed": True,
}

# Latency SLO gate
p95 = latency.get("p95_ms")
p99 = latency.get("p99_ms")
if p95 is not None and p95 > 1500:
    add_issue("high", "Latency SLO breach (P95)", f"p95_ms={p95}")
if p99 is not None and p99 > 3000:
    add_issue("high", "Latency SLO breach (P99)", f"p99_ms={p99}")

required = [
    "1_bot_start_normal_ref_pay",
    "2_plan_purchase_simulated_webhook",
    "3_plan_purchase_live_telegram_stars",
    "4_duplicate_webhook_replay",
    "5_concurrent_create_or_get_same_tg",
    "6_add_device_until_limit",
    "7_expired_subscription_add_device",
    "8_device_reset_success_and_node_failure_fallback",
    "9_admin_login_invalid_valid_expired_refresh",
    "10_servers_users_plans_crud_smoke_rbac",
    "11_telemetry_alerts_failure_surfaced_ui",
    "12_telemetry_logs_unsupported_failure_surfaced_ui",
    "13_websocket_events_no_duplicates_over_sustained_session",
    "14_partial_dependency_outage_recovery_behavior",
    "15_log_sweep_contains_no_unresolved_critical_patterns",
]

critical = [i for i in issues if i["severity"] == "critical"]
high = [i for i in issues if i["severity"] == "high"]
warning = [i for i in issues if i["severity"] == "warning"]
missing = [k for k in required if not scenarios.get(k, {}).get("executed", False)]

score = 100
score -= 25 * len(critical)
score -= 10 * len(high)
score -= 3 * len(warning)
score -= 5 * len(missing)
score = max(0, min(100, score))

if critical:
    verdict = "RELEASE BLOCKED"
elif score < 90 or len(high) >= 2:
    verdict = "FIX REQUIRED BEFORE DEPLOY"
else:
    verdict = "SAFE FOR PRE-RELEASE"

report_md = []
report_md.append(f"A) Zero-Failure Readiness Score (0-100)\n{score}")
report_md.append("B) CRITICAL RISKS (Release Blockers)\n" + ("\n".join([f"- {i['title']}: {i['details']}" for i in critical]) if critical else "- none"))
report_md.append("C) HIGH-RISK BUGS\n" + ("\n".join([f"- {i['title']}: {i['details']}" for i in high]) if high else "- none"))
report_md.append("D) WARNINGS\n" + ("\n".join([f"- {i['title']}: {i['details']}" for i in warning]) if warning else "- none"))
safe = [k for k, v in scenarios.items() if v.get("executed") and v.get("passed")]
report_md.append("E) VERIFIED SAFE FLOWS\n" + ("\n".join([f"- {s}" for s in safe]) if safe else "- none"))
report_md.append(f"F) FINAL VERDICT\n{verdict}")

(out_dir / "final_report.md").write_text("\n\n".join(report_md) + "\n", encoding="utf-8")
final = {
    "score": score,
    "verdict": verdict,
    "critical": len(critical),
    "high": len(high),
    "warning": len(warning),
    "missing": len(missing),
    "missing_required_scenarios": missing,
    "latency": latency,
}
(out_dir / "final_summary.json").write_text(json.dumps(final, indent=2), encoding="utf-8")
print(json.dumps(final))
PY

echo "Artifacts: $OUT_DIR"
echo "Final report: $OUT_DIR/final_report.md"
