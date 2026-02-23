#!/usr/bin/env bash
set -euo pipefail

DOMAIN="${1:-vpn.vega.llc}"
EXPECT_IPV4="${2:-}"
HEALTH_URL="${3:-https://$DOMAIN/health}"
RESOLVERS=(1.1.1.1 8.8.8.8 9.9.9.9)

fail=0
now_utc=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
echo "[$now_utc] dns_synthetic_check domain=$DOMAIN health=$HEALTH_URL"

for r in "${RESOLVERS[@]}"; do
  ans=$(dig @"$r" "$DOMAIN" A +short | head -n1 || true)
  if [[ -z "$ans" ]]; then
    echo "resolver=$r status=FAIL reason=no_a_record"
    fail=1
    continue
  fi
  if [[ -n "$EXPECT_IPV4" && "$ans" != "$EXPECT_IPV4" ]]; then
    echo "resolver=$r status=FAIL reason=unexpected_a_record got=$ans expected=$EXPECT_IPV4"
    fail=1
    continue
  fi
  echo "resolver=$r status=OK a_record=$ans"
done

if ! curl -fsS --max-time 10 "$HEALTH_URL" >/tmp/dns_synthetic_health.json; then
  echo "health status=FAIL reason=request_failed url=$HEALTH_URL"
  fail=1
else
  echo "health status=OK url=$HEALTH_URL body=$(head -c 200 /tmp/dns_synthetic_health.json)"
fi

if [[ "$fail" -ne 0 ]]; then
  echo "result=FAIL"
  exit 1
fi

echo "result=OK"
