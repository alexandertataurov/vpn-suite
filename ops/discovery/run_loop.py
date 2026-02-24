#!/usr/bin/env python3
"""Run discovery every N seconds. Idempotent."""

from __future__ import annotations

import asyncio
import os
import sys
import time
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent.parent))



def _atomic_write(path: Path, payload: dict | list) -> None:
    tmp = path.with_suffix(path.suffix + ".tmp")
    tmp.write_text(__import__("json").dumps(payload, indent=2), encoding="utf-8")
    tmp.replace(path)


def _load_state(path: Path) -> dict:
    try:
        return __import__("json").loads(path.read_text(encoding="utf-8"))
    except Exception:
        return {}


def _save_state(path: Path, state: dict) -> None:
    _atomic_write(path, state)


def _target_key(t: dict) -> str:
    labels = t.get("labels") or {}
    target = (t.get("targets") or [""])[0]
    return f"{labels.get('sd_job','unknown')}|{target}"


async def run_once(out_dir: str) -> None:
    from ops.discovery.discovery_service import run_discovery, host_nic_ips, host_ss_listeners, _has_listener, _ensure_host_id
    from ops.discovery.correlation_engine import correlate
    import json
    from datetime import datetime, timezone
    from contextlib import asynccontextmanager

    async def _can_connect(host: str, port: int, timeout: float = 0.5) -> bool:
        try:
            reader, writer = await asyncio.wait_for(asyncio.open_connection(host, port), timeout=timeout)
            writer.close()
            try:
                await writer.wait_closed()
            except Exception:
                pass
            return True
        except Exception:
            return False

    def _parse_hostport(raw: str) -> tuple[str, int] | None:
        if not raw or ":" not in raw:
            return None
        host, _, port_s = raw.rpartition(":")
        try:
            port = int(port_s)
        except ValueError:
            return None
        if not host:
            return None
        return host, port
    nodes = await run_discovery()
    node_dicts = [{
        "host_id": n.host_id,
        "node_id": n.node_id,
        "source": n.source,
        "kind": n.kind,
        "classification": n.classification,
        "confidence": n.confidence,
        "evidence": n.evidence,
        "container_id": n.container_id,
        "image": n.image,
        "created": n.created,
        "ports": n.ports,
        "mounts": n.mounts,
        "interface": n.interface,
        "public_key": n.public_key,
    } for n in nodes]

    Path(out_dir).mkdir(parents=True, exist_ok=True)
    inv = {"timestamp": datetime.now(timezone.utc).isoformat(), "nodes": node_dicts}
    _atomic_write(Path(out_dir) / "inventory.json", inv)
    nic_ips = await host_nic_ips()
    mapping = {"entries": correlate(node_dicts, host_nic_ips=nic_ips)}
    _atomic_write(Path(out_dir) / "mapping.json", mapping)

    host_id = _ensure_host_id()
    listeners = await host_ss_listeners()

    base_targets = [
        {"labels": {"sd_job": "admin-api", "host_id": host_id}, "targets": ["admin-api:8000"]},
        {"labels": {"sd_job": "node-exporter", "host_id": host_id}, "targets": ["node-exporter:9100"]},
        {"labels": {"sd_job": "cadvisor", "host_id": host_id}, "targets": ["cadvisor:8080"]},
    ]
    dynamic_targets: list[dict] = []

    if any((n.get("classification") or {}).get("type") == "exporter" and "node-agent" in (n.get("image") or "") for n in node_dicts):
        dynamic_targets.append({"labels": {"sd_job": "node-agent", "host_id": host_id}, "targets": ["node-agent:9105"]})
    if any((n.get("classification") or {}).get("type") == "exporter" and "telegram-vpn-bot" in (n.get("image") or "") for n in node_dicts):
        dynamic_targets.append({"labels": {"sd_job": "telegram-vpn-bot", "host_id": host_id}, "targets": ["telegram-vpn-bot:8090"]})
    wg_target = None
    for n in node_dicts:
        if (n.get("classification") or {}).get("type") != "exporter":
            continue
        if "wg-exporter" not in (n.get("image") or ""):
            continue
        ips = n.get("ip_addresses") or []
        if ips:
            wg_target = f"{ips[0]}:9586"
            break
    if not wg_target and await _can_connect("host.docker.internal", 9586):
        wg_target = "host.docker.internal:9586"
    if wg_target:
        dynamic_targets.append({"labels": {"sd_job": "wg-exporter", "host_id": host_id}, "targets": [wg_target]})

    for n in node_dicts:
        if n.get("kind") != "awg":
            continue
        ports = n.get("ports") or []
        for p in ports:
            if isinstance(p, dict) and p.get("port") == 9586:
                if not wg_target and await _can_connect("host.docker.internal", 9586):
                    wg_target = "host.docker.internal:9586"
                if wg_target:
                    dynamic_targets.append({"labels": {"sd_job": "wg-exporter", "host_id": host_id}, "targets": [wg_target]})
                break

    ttl = int(os.environ.get("DISCOVERY_TARGET_TTL_SECONDS", "180"))
    state_path = Path(out_dir) / ".targets_state.json"
    state = _load_state(state_path)
    now = time.time()
    for t in base_targets + dynamic_targets:
        key = _target_key(t)
        state[key] = {"last_seen": now, "target": t}
    out_targets: list[dict] = []
    for key, entry in state.items():
        last = float(entry.get("last_seen") or 0)
        target = entry.get("target")
        if not isinstance(target, dict):
            continue
        if now - last <= ttl:
            out_targets.append(target)
    _save_state(state_path, state)
    _atomic_write(Path(out_dir) / "targets.json", out_targets)


async def loop() -> None:
    interval = int(os.environ.get("DISCOVERY_INTERVAL_SECONDS", "60"))
    out_dir = os.environ.get("DISCOVERY_OUT_DIR", "/work")
    while True:
        try:
            await run_once(out_dir)
        except Exception as e:
            import traceback
            traceback.print_exc()
        await asyncio.sleep(interval)


if __name__ == "__main__":
    asyncio.run(loop())
