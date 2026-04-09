#!/usr/bin/env python3
import json
import os
import sys
import time

DEFAULT_TARGETS = [
    {"targets": ["admin-api:8000"], "labels": {"sd_job": "admin-api"}},
    {"targets": ["cadvisor:8080"], "labels": {"sd_job": "cadvisor"}},
    {"targets": ["node-exporter:9100"], "labels": {"sd_job": "node-exporter"}},
    {"targets": ["node-agent:9105"], "labels": {"sd_job": "node-agent"}},
    {"targets": ["telegram-vpn-bot:8090"], "labels": {"sd_job": "telegram-vpn-bot"}},
]


def _atomic_write(path: str, payload: dict | list) -> None:
    # Bind-mounted single-file volumes keep inode; replace breaks updates inside containers.
    with open(path, "w", encoding="utf-8") as f:
        json.dump(payload, f, indent=2, sort_keys=True)
        f.write("\n")


def _run_once() -> int:
    targets_path = os.getenv("INVENTORY_TARGETS_PATH", "/work/targets.json")
    mapping_path = os.getenv("INVENTORY_MAPPING_PATH", "/work/mapping.json")
    _atomic_write(mapping_path, {})
    _atomic_write(targets_path, DEFAULT_TARGETS)
    return 0


def main() -> int:
    if "--once" in sys.argv:
        return _run_once()
    interval = int(os.getenv("INVENTORY_INTERVAL_SECONDS", "60"))
    while True:
        _run_once()
        time.sleep(max(10, interval))


if __name__ == "__main__":
    raise SystemExit(main())
