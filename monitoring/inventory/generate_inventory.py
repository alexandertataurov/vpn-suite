#!/usr/bin/env python3
import json
import os
import sys
import time
from urllib.parse import urlparse

import psycopg2
import requests

DEFAULT_TARGETS = [
    {"targets": ["admin-api:8000"], "labels": {"sd_job": "admin-api"}},
    {"targets": ["cadvisor:8080"], "labels": {"sd_job": "cadvisor"}},
    {"targets": ["node-exporter:9100"], "labels": {"sd_job": "node-exporter"}},
    {"targets": ["node-agent:9105"], "labels": {"sd_job": "node-agent"}},
    {"targets": ["telegram-vpn-bot:8090"], "labels": {"sd_job": "telegram-vpn-bot"}},
    {"targets": ["host.docker.internal:19092"], "labels": {"sd_job": "outline-ss"}},
    {"targets": ["outline-poller:9106"], "labels": {"sd_job": "outline-poller"}},
]


def _load_json(path: str) -> dict:
    try:
        with open(path, "r", encoding="utf-8") as f:
            return json.load(f) or {}
    except FileNotFoundError:
        return {}
    except Exception:
        return {}


def _atomic_write(path: str, payload: dict | list) -> None:
    # Bind-mounted single-file volumes keep inode; replace breaks updates inside containers.
    with open(path, "w", encoding="utf-8") as f:
        json.dump(payload, f, indent=2, sort_keys=True)
        f.write("\n")


def _parse_host(endpoint: str) -> str | None:
    if not endpoint:
        return None
    try:
        if "://" not in endpoint:
            endpoint = f"//{endpoint}"
        parsed = urlparse(endpoint)
        host = parsed.hostname
        return host
    except Exception:
        return None


def _fetch_outline_server(base_url: str, timeout: float) -> dict | None:
    if not base_url:
        return None
    url = base_url.rstrip("/") + "/server"
    try:
        r = requests.get(url, timeout=timeout, verify=False)
        if r.status_code != 200:
            return None
        return r.json()
    except Exception:
        return None


def _load_db_servers(dsn: str) -> tuple[dict[str, str], dict[str, str]]:
    vpn_hosts: dict[str, str] = {}
    ip_hosts: dict[str, str] = {}
    if not dsn:
        return vpn_hosts, ip_hosts
    if dsn.startswith("postgresql+asyncpg://"):
        dsn = "postgresql://" + dsn.split("postgresql+asyncpg://", 1)[1]
    conn = psycopg2.connect(dsn)
    try:
        with conn.cursor() as cur:
            cur.execute("SELECT id, vpn_endpoint FROM servers WHERE is_active = true")
            for server_id, vpn_endpoint in cur.fetchall():
                host = _parse_host(vpn_endpoint or "")
                if host:
                    vpn_hosts[host] = server_id
            cur.execute("SELECT server_id, ip FROM server_ips")
            for server_id, ip in cur.fetchall():
                if ip:
                    ip_hosts[ip] = server_id
    finally:
        conn.close()
    return vpn_hosts, ip_hosts


def _build_mapping(outline_server: dict | None, vpn_hosts: dict, ip_hosts: dict, overrides: dict) -> dict:
    mapping = {"outline": {}}
    if not outline_server:
        return mapping

    hostname = outline_server.get("hostname") or outline_server.get("hostnameForAccessKeys")
    server_id = outline_server.get("serverId")
    mapping["outline"]["server_id"] = server_id
    mapping["outline"]["hostname"] = hostname

    override = overrides.get("outline") if isinstance(overrides, dict) else None
    if isinstance(override, dict) and override.get("matched_server_id"):
        mapping["outline"]["matched_server_id"] = override.get("matched_server_id")
        mapping["outline"]["match_reason"] = override.get("match_reason") or "operator_override"
        return mapping

    if hostname and hostname in ip_hosts:
        mapping["outline"]["matched_server_id"] = ip_hosts[hostname]
        mapping["outline"]["match_reason"] = "hostname->server_ips.ip"
        return mapping

    if hostname and hostname in vpn_hosts:
        mapping["outline"]["matched_server_id"] = vpn_hosts[hostname]
        mapping["outline"]["match_reason"] = "hostname->servers.vpn_endpoint"
        return mapping

    return mapping


def _run_once() -> int:
    targets_path = os.getenv("INVENTORY_TARGETS_PATH", "/work/targets.json")
    mapping_path = os.getenv("INVENTORY_MAPPING_PATH", "/work/mapping.json")
    overrides_path = os.getenv("INVENTORY_OVERRIDES_PATH", "/work/overrides.json")
    outline_url = os.getenv("OUTLINE_MANAGER_URL", "").strip()
    timeout = float(os.getenv("OUTLINE_TIMEOUT_SECONDS", "10"))
    dsn = os.getenv("DATABASE_URL", "").strip()

    overrides = _load_json(overrides_path)

    outline_server = _fetch_outline_server(outline_url, timeout)
    vpn_hosts, ip_hosts = _load_db_servers(dsn)

    mapping = _build_mapping(outline_server, vpn_hosts, ip_hosts, overrides)
    _atomic_write(mapping_path, mapping)
    _atomic_write(targets_path, DEFAULT_TARGETS)
    return 0


def main() -> int:
    if os.getenv("INVENTORY_DISABLED", "1").lower() in ("1", "true", "yes"):
        print("inventory: disabled (INVENTORY_DISABLED=1)")
        return 0
    if "--once" in sys.argv:
        return _run_once()
    interval = int(os.getenv("INVENTORY_INTERVAL_SECONDS", "60"))
    while True:
        _run_once()
        time.sleep(max(10, interval))


if __name__ == "__main__":
    raise SystemExit(main())
