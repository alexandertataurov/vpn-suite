#!/usr/bin/env python3
"""CLI: run discovery and emit inventory.json, mapping.json, targets.json."""

from __future__ import annotations

import argparse
import asyncio
import json
import os
import sys
from dataclasses import asdict
from pathlib import Path

# Add parent so we can import discovery modules
sys.path.insert(0, str(Path(__file__).resolve().parent.parent.parent))

try:
    from .correlation_engine import correlate
    from .discovery_service import (
        DiscoveredNode,
        host_nic_ips,
        run_discovery,
        host_ss_listeners,
        _has_listener,
        _ensure_host_id,
        has_outline_ss_proxy,
    )
except ImportError:
    from ops.discovery.correlation_engine import correlate
    from ops.discovery.discovery_service import (
        DiscoveredNode,
        host_nic_ips,
        run_discovery,
        host_ss_listeners,
        _has_listener,
        _ensure_host_id,
        has_outline_ss_proxy,
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


async def _fetch_outline_info(url: str | None) -> dict | None:
    if not url or not url.strip():
        return None
    try:
        import httpx
        async with httpx.AsyncClient(timeout=10.0) as c:
            r = await c.get(url.strip().rstrip("/") + "/server")
            if r.status_code == 200:
                return r.json()
    except Exception:
        pass
    return None


async def _build_targets(nodes: list[dict], outline_url: str | None) -> list[dict]:
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
    ]
    if any((n.get("classification") or {}).get("type") == "exporter" and "node-agent" in (n.get("image") or "") for n in nodes):
        targets.append({"labels": {"sd_job": "node-agent", "host_id": host_id}, "targets": ["node-agent:9105"]})
    if any((n.get("classification") or {}).get("type") == "exporter" and "telegram-vpn-bot" in (n.get("image") or "") for n in nodes):
        targets.append({"labels": {"sd_job": "telegram-vpn-bot", "host_id": host_id}, "targets": ["telegram-vpn-bot:8090"]})
    if any((n.get("classification") or {}).get("type") == "exporter" and "outline-poller" in (n.get("image") or "") for n in nodes):
        targets.append({"labels": {"sd_job": "outline-poller", "host_id": host_id}, "targets": ["outline-poller:9106"]})
    outline_present = any((n.get("classification") or {}).get("type") == "outline-shadowbox" for n in nodes)
    outline_proxy = await has_outline_ss_proxy()
    outline_addr = os.environ.get("OUTLINE_SS_METRICS_ADDR", "").strip()
    outline_target = None
    if outline_present and outline_proxy and await _can_connect("host.docker.internal", 19092):
        outline_target = "host.docker.internal:19092"
    elif outline_present and outline_addr:
        parsed = _parse_hostport(outline_addr)
        if parsed and await _can_connect(parsed[0], parsed[1]):
            outline_target = outline_addr
    if outline_target:
        targets.append({"labels": {"sd_job": "outline-ss", "host_id": host_id}, "targets": [outline_target]})
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
    ap.add_argument("--outline-url", default=os.environ.get("OUTLINE_MANAGER_URL"), help="Outline API URL")
    args = ap.parse_args()
    out_dir = Path(args.out_dir)
    out_dir.mkdir(parents=True, exist_ok=True)

    outline_info = await _fetch_outline_info(args.outline_url)
    nodes = await run_discovery(outline_info=outline_info)
    node_dicts = [_node_to_dict(n) for n in nodes]

    inventory = {
        "timestamp": __import__("datetime").datetime.now(__import__("datetime").timezone.utc).isoformat(),
        "nodes": node_dicts,
        "outline_info": outline_info,
    }
    _atomic_write(out_dir / "inventory.json", inventory)

    outline_servers = [outline_info] if outline_info else []
    nic_ips = await host_nic_ips()
    mapping = {"entries": correlate(outline_servers, node_dicts, host_nic_ips=nic_ips)}
    _atomic_write(out_dir / "mapping.json", mapping)

    targets = await _build_targets(node_dicts, args.outline_url)
    _atomic_write(out_dir / "targets.json", targets)

    return 0


if __name__ == "__main__":
    sys.exit(asyncio.run(main()))
