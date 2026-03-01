#!/usr/bin/env bash
# Удаление конфигурации nginx для домена (запускать на сервере с sudo).
set -euo pipefail
IFS=$'\n\t'

if [[ $EUID -ne 0 ]]; then
  echo "Запустите с sudo: sudo $0" >&2
  exit 1
fi

[[ "${FORCE:-0}" == "1" ]] || { echo "Set FORCE=1 to proceed." >&2; exit 1; }

DOMAIN="${1:-${DOMAIN:-vpn.vega.llc}}"

REMOVED=
for path in \
  "/etc/nginx/sites-enabled/${DOMAIN}" \
  "/etc/nginx/sites-enabled/${DOMAIN}.conf" \
  "/etc/nginx/conf.d/${DOMAIN}.conf" \
  "/etc/nginx/sites-available/${DOMAIN}" \
  "/etc/nginx/sites-available/${DOMAIN}.conf" \
  ; do
  if [[ -f "$path" ]]; then
    rm -f "$path"
    echo "Удалён: $path"
    REMOVED=1
  fi
done

if [[ -n "$REMOVED" ]]; then
  nginx -t && systemctl reload nginx
  echo "Nginx перезагружен."
  systemctl stop nginx
  echo "Nginx остановлен (80/443 свободны для Caddy)."
else
  echo "Файлы конфигурации ${DOMAIN} не найдены."
fi

echo "Дальше: cd /opt/vpn-suite && ./manage.sh up-core"
