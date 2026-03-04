#!/bin/sh
set -eu

: "${ALERTMANAGER_TELEGRAM_BOT_TOKEN:?set ALERTMANAGER_TELEGRAM_BOT_TOKEN}"
: "${ALERTMANAGER_TELEGRAM_CHAT_ID:?set ALERTMANAGER_TELEGRAM_CHAT_ID}"

CONFIG_IN="/etc/alertmanager/alertmanager.yml"
CONFIG_OUT="/tmp/alertmanager.yml"

awk -v token="$ALERTMANAGER_TELEGRAM_BOT_TOKEN" -v chat="$ALERTMANAGER_TELEGRAM_CHAT_ID" '
  { gsub("\\${ALERTMANAGER_TELEGRAM_BOT_TOKEN}", token); gsub("\\${ALERTMANAGER_TELEGRAM_CHAT_ID}", chat); print }
' "$CONFIG_IN" > "$CONFIG_OUT"

exec /bin/alertmanager --config.file="$CONFIG_OUT" --log.level="${ALERTMANAGER_LOG_LEVEL:-info}"
