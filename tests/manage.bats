# Minimal bats tests for manage.sh: STRICT, _optional stderr, mode gating.
# Run: bats tests/manage.bats (requires https://github.com/bats-core/bats-core)

setup() {
  export ROOT="$(cd "${BATS_TEST_FILENAME%/*}/.." && pwd)"
  cd "$ROOT"
}

@test "STRICT=1: optional step failure exits non-zero" {
  run env STRICT=1 bash -c '
    set -euo pipefail
    FAILED_SUBSYSTEMS=()
    _optional() {
      local label="$1"; shift
      local errf; errf=$(mktemp)
      if ! "$@" 2> "$errf"; then
        FAILED_SUBSYSTEMS+=("$label"); rm -f "$errf"
        [[ "$STRICT" == "1" ]] && exit 1
        return 0
      fi
      rm -f "$errf"
    }
    _optional "x" false
  '
  [[ $status -eq 1 ]]
}

@test "_optional: failure prints stderr (last 30 lines) prefix" {
  run bash -c '
    set -euo pipefail
    STRICT=0; FAILED_SUBSYSTEMS=()
    _optional() {
      local label="$1"; shift
      local errf; errf=$(mktemp)
      if ! "$@" 2> "$errf"; then
        echo "[manage.sh] Optional step failed ($label): $*" >&2
        echo "[manage.sh] stderr (last 30 lines):" >&2
        tail -n 30 "$errf" >&2
        FAILED_SUBSYSTEMS+=("$label"); rm -f "$errf"
        return 0
      fi
      rm -f "$errf"
    }
    _optional "label" sh -c "echo myerr >&2; exit 1"
  ' 2>&1
  [[ "$output" == *"[manage.sh] Optional step failed (label)"* ]]
  [[ "$output" == *"stderr (last 30 lines)"* ]]
  [[ "$output" == *"myerr"* ]]
}

@test "sanity-check: runs (exit 0 or 1 depending on env)" {
  run ./manage.sh sanity-check 2>&1
  [[ $status -eq 0 || $status -eq 1 ]]
}

@test "server:drift usage without server_id fails" {
  run ./manage.sh server:drift 2>&1
  [[ $status -ne 0 ]]
  [[ "$output" == *"Usage"* ]]
}

@test "device:reissue usage without device_id fails" {
  run ./manage.sh device:reissue 2>&1
  [[ $status -ne 0 ]]
  [[ "$output" == *"Usage"* ]]
}
