#!/usr/bin/env python3
"""CLI: run discovery and emit inventory.json, targets.json."""

from __future__ import annotations

import argparse
import asyncio
import json
import sys
from pathlib import Path

# Add parent so we can import discovery modules
sys.path.insert(0, str(Path(__file__).resolve().parent.parent.parent))

try:
    from .discovery_service import (
        DiscoveredNode,
        run_discovery,
        host_ss_listeners,
        _has_listener,
        _ensure_host_id,
    )
except ImportError:
    from infra.discovery.runtime.discovery_service import (
        DiscoveredNode,
        run_discovery,
        host_ss_listeners,
        _ensure_host_id,
    )


def _node_to_dict(n: DiscoveredNode) -> dict:
    return {
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
        "ip_addresses": n.ip_addresses,
        "interface": n.interface,
        "public_key": n.public_key,
    }


def _atomic_write(path: Path, payload: dict | list) -> None:
    tmp = path.with_suffix(path.suffix + ".tmp")
    tmp.write_text(json.dumps(payload, indent=2), encoding="utf-8")
    tmp.replace(path)


async def _build_targets(nodes: list[dict]) -> list[dict]:
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

    host_id = _ensure_host_id()
    listeners = await host_ss_listeners()
    targets = [
        {"labels": {"sd_job": "admin-api", "host_id": host_id}, "targets": ["admin-api:8000"]},
        {"labels": {"sd_job": "node-exporter", "host_id": host_id}, "targets": ["node-exporter:9100"]},
        {"labels": {"sd_job": "cadvisor", "host_id": host_id}, "targets": ["cadvisor:8080"]},
        {"labels": {"sd_job": "alertmanager", "host_id": host_id}, "targets": ["alertmanager:9093"]},
        {"labels": {"sd_job": "otel-collector", "host_id": host_id}, "targets": ["otel-collector:8888"]},
        {"labels": {"sd_job": "tempo", "host_id": host_id}, "targets": ["tempo:3200"]},
    ]
    if any((n.get("classification") or {}).get("type") == "exporter" and "node-agent" in (n.get("image") or "") for n in nodes):
        targets.append({"labels": {"sd_job": "node-agent", "host_id": host_id}, "targets": ["node-agent:9105"]})
    if any((n.get("classification") or {}).get("type") == "exporter" and "telegram-vpn-bot" in (n.get("image") or "") for n in nodes):
        targets.append({"labels": {"sd_job": "telegram-vpn-bot", "host_id": host_id}, "targets": ["telegram-vpn-bot:8090"]})
    wg_target = None
    for n in nodes:
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
        targets.append({"labels": {"sd_job": "wg-exporter", "host_id": host_id}, "targets": [wg_target]})
    for n in nodes:
        if n.get("kind") != "awg":
            continue
        for p in n.get("ports") or []:
            if isinstance(p, dict) and p.get("port") == 9586:
                if not wg_target and await _can_connect("host.docker.internal", 9586):
                    wg_target = "host.docker.internal:9586"
                if wg_target:
                    targets.append({"labels": {"sd_job": "wg-exporter", "host_id": host_id}, "targets": [wg_target]})
                break
        else:
            continue
        break
    return targets


async def main() -> int:
    ap = argparse.ArgumentParser(description="Deterministic VPN discovery")
    ap.add_argument("--out-dir", default=".", help="Output directory for JSON files")
    args = ap.parse_args()
    out_dir = Path(args.out_dir)
    out_dir.mkdir(parents=True, exist_ok=True)

    nodes = await run_discovery()
    node_dicts = [_node_to_dict(n) for n in nodes]

    inventory = {
        "timestamp": __import__("datetime").datetime.now(__import__("datetime").timezone.utc).isoformat(),
        "nodes": node_dicts,
    }
    _atomic_write(out_dir / "inventory.json", inventory)

    targets = await _build_targets(node_dicts)
    _atomic_write(out_dir / "targets.json", targets)

    return 0


if __name__ == "__main__":
    sys.exit(asyncio.run(main()))
