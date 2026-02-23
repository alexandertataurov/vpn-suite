"""Deterministic VPN discovery. Uses Docker inspect + host signals. No container names."""

from __future__ import annotations

import asyncio
import json
import os
import subprocess
from dataclasses import asdict, dataclass, field
from datetime import datetime, timezone
from pathlib import Path
from typing import Any
from uuid import uuid4

from .fingerprint_classifier import (
    ClassificationResult,
    CandidateClassification,
    classify_candidate,
    classify_container,
)


@dataclass
class DiscoveredNode:
    host_id: str
    node_id: str  # stable: hash of image+container_id or host+interface
    source: str  # docker | host
    kind: str
    classification: dict[str, Any]
    confidence: float = 0.0
    evidence: list[str] = field(default_factory=list)
    container_id: str | None = None
    image: str = ""
    created: str | None = None
    ports: list[dict[str, Any]] = field(default_factory=list)
    mounts: list[str] = field(default_factory=list)
    ip_addresses: list[str] = field(default_factory=list)
    interface: str | None = None  # wg0, awg0 for host
    public_key: str | None = None


def _run(cmd: list[str], timeout: float = 15.0) -> tuple[int, str]:
    try:
        r = subprocess.run(
            cmd,
            capture_output=True,
            text=True,
            timeout=timeout,
            env={**os.environ, "PATH": os.environ.get("PATH", "/usr/bin:/bin")},
        )
        out = (r.stdout or "") + (r.stderr or "")
        return r.returncode or 0, out
    except (subprocess.TimeoutExpired, FileNotFoundError, OSError):
        return -1, ""


async def _run_async(cmd: list[str], timeout: float = 15.0) -> tuple[int, str]:
    return await asyncio.to_thread(_run, cmd, timeout)


async def _image_inspect(image_ref: str) -> tuple[list[str], str | None]:
    """Run docker image inspect; return (RepoDigests, Id)."""
    if not image_ref or not image_ref.strip():
        return [], None
    code, out = await _run_async(
        ["docker", "image", "inspect", image_ref.strip()],
        timeout=10.0,
    )
    if code != 0:
        return [], None
    try:
        arr = json.loads(out)
        if not arr or not isinstance(arr, list):
            return [], None
        img = arr[0] if isinstance(arr[0], dict) else {}
        digests = list(img.get("RepoDigests") or [])
        img_id = img.get("Id") or img.get("ID")
        return digests, str(img_id) if img_id else None
    except (json.JSONDecodeError, TypeError, IndexError):
        return [], None


def _ensure_host_id(path: str = "/etc/vpn-suite/node-id") -> str:
    """Return stable host_id from disk, creating if missing."""
    p = Path(path)
    try:
        if p.exists():
            value = p.read_text(encoding="utf-8").strip()
            if value:
                return value
    except Exception:
        pass
    try:
        p.parent.mkdir(parents=True, exist_ok=True)
        value = str(uuid4())
        p.write_text(value + "\n", encoding="utf-8")
        return value
    except Exception:
        return "local"


async def docker_inspect_bulk(host_id: str = "local") -> list[dict[str, Any]]:
    """Bulk docker inspect. Returns list of inspect dicts."""
    code, out = await _run_async(
        ["docker", "ps", "-aq"],
        timeout=10.0,
    )
    if code != 0 or not out.strip():
        return []
    ids = [x.strip() for x in out.strip().splitlines() if x.strip()]
    if not ids:
        return []
    code2, out2 = await _run_async(
        ["docker", "inspect"] + ids[:200],
        timeout=30.0,
    )
    if code2 != 0:
        return []
    try:
        return json.loads(out2)
    except json.JSONDecodeError:
        return []


def _parse_ss_listeners(out: str) -> list[dict[str, Any]]:
    """Parse ss -lntup (TCP) and ss -lnup (UDP) output for listeners."""
    result: list[dict[str, Any]] = []
    for line in out.strip().splitlines()[1:]:  # skip header
        parts = line.split()
        if len(parts) < 5:
            continue
        # NETID STATE LOCAL:PORT PEER:PORT (udp) or REMOTE:PORT for tcp
        try:
            local = parts[4] if len(parts) > 4 else ""
            if ":" in local:
                host, port_str = local.rsplit(":", 1)
                port = int(port_str)
                proto = parts[0].lower() if parts else ""
                result.append({"port": port, "protocol": "udp" if "udp" in proto else "tcp"})
        except (ValueError, IndexError):
            pass
    return result


async def host_ss_listeners() -> list[dict[str, Any]]:
    """Run ss -lntup and ss -lnup; return listeners relevant to WG + outline metrics."""
    result: list[dict[str, Any]] = []
    for cmd in [["ss", "-lntup"], ["ss", "-lnup"]]:
        code, out = await _run_async(cmd, timeout=5.0)
        if code == 0 and out:
            for r in _parse_ss_listeners(out):
                port = r.get("port")
                if not port:
                    continue
                if (51820 <= port <= 52000) or port in (19092, 9092, 25432):
                    if r not in result:
                        result.append(r)
    return result


def _has_listener(listeners: list[dict[str, Any]], port: int, proto: str | None = None) -> bool:
    for l in listeners:
        if l.get("port") == port and (proto is None or l.get("protocol") == proto):
            return True
    return False


def _parse_ip_link(out: str) -> list[str]:
    """Parse ip link show; return wg/awg interface names."""
    interfaces: list[str] = []
    for line in out.strip().splitlines():
        if ":" in line:
            # "2: eth0: <BROADCAST,MULTICAST,UP,LOWER_UP>"
            parts = line.split(":", 2)
            if len(parts) >= 2:
                name = parts[1].strip()
                if name and ("wg" in name.lower() or "awg" in name.lower()):
                    interfaces.append(name)
    return interfaces


async def host_ip_links() -> list[str]:
    """Run ip link show; return wg/awg interface names."""
    code, out = await _run_async(["ip", "link", "show"], timeout=5.0)
    if code != 0 or not out:
        return []
    return _parse_ip_link(out)


def _parse_ip_addr(out: str) -> list[str]:
    """Parse ip -4 addr output; return host NIC IPv4 addresses."""
    ips: list[str] = []
    for line in out.strip().splitlines():
        line = line.strip()
        if line.startswith("inet "):
            parts = line.split()
            if len(parts) >= 2:
                addr = parts[1].split("/")[0]
                if addr and addr != "127.0.0.1":
                    ips.append(addr)
    return ips


async def host_nic_ips() -> list[str]:
    """Run ip -4 addr; return host NIC IPv4 addresses (excluding loopback)."""
    code, out = await _run_async(["ip", "-4", "addr"], timeout=5.0)
    if code != 0 or not out:
        return []
    return _parse_ip_addr(out)


async def host_wg_dump() -> list[dict[str, Any]]:
    """Host-level wg/awg interfaces via wg show interfaces."""
    code, out = await _run_async(["wg", "show", "interfaces"], timeout=10.0)
    if code != 0 or not out.strip():
        return []
    result: list[dict[str, Any]] = []
    for iface in out.strip().split():
        iface = iface.strip()
        if not iface:
            continue
        c2, o2 = await _run_async(["wg", "show", iface], timeout=5.0)
        pubkey, port = "", 0
        for line in (o2 or "").splitlines():
            if "public key:" in line.lower():
                pubkey = line.split(":", 1)[-1].strip()
            if "listening port:" in line.lower():
                try:
                    port = int(line.split(":", 1)[-1].strip())
                except ValueError:
                    pass
        result.append({"interface": iface, "public_key": pubkey, "listen_port": port})
    return result


async def discover_docker(
    outline_info: dict[str, Any] | None = None,
) -> list[DiscoveredNode]:
    nodes: list[DiscoveredNode] = []
    host_id = _ensure_host_id()
    for inspect in await docker_inspect_bulk():
        cid = (inspect.get("Id") or "")[:12]
        if not cid:
            continue
        state = inspect.get("State") or {}
        if state.get("Status") != "running":
            continue
        image = (inspect.get("Config") or {}).get("Image") or inspect.get("Image") or ""
        repo_digests, image_id = await _image_inspect(image)
        cl = classify_container(
            "local",
            cid,
            inspect,
            outline_info=outline_info,
            repo_digests=repo_digests,
            image_id=image_id,
        )
        coarse = classify_candidate(
            host_id,
            cid,
            inspect,
            outline_info=outline_info,
            repo_digests=repo_digests,
            image_id=image_id,
        )
        created = inspect.get("Created")
        ports: list[dict[str, Any]] = []
        seen: set[tuple[int, str]] = set()
        ports_raw = (inspect.get("NetworkSettings") or {}).get("Ports") or {}
        exp = (inspect.get("Config") or {}).get("ExposedPorts") or {}
        for k in list(exp) + list(ports_raw):
            if "/" in str(k):
                ps, proto = str(k).rsplit("/", 1)
                p = int(ps) if ps.isdigit() else 0
                key = (p, proto)
                if key not in seen:
                    seen.add(key)
                    ports.append({"port": p, "protocol": proto})
        mounts = [m.get("Destination", "") for m in inspect.get("Mounts") or [] if isinstance(m, dict)]
        ip_addresses: list[str] = []
        networks = (inspect.get("NetworkSettings") or {}).get("Networks") or {}
        if isinstance(networks, dict):
            for net in networks.values():
                if not isinstance(net, dict):
                    continue
                ip = (net.get("IPAddress") or "").strip()
                if ip and ip not in ip_addresses:
                    ip_addresses.append(ip)
        node_id = f"docker:{cid}"  # stable even if container renamed
        nodes.append(
            DiscoveredNode(
                host_id=host_id,
                node_id=node_id,
                source="docker",
                kind=cl.kind,
                classification={**cl.to_dict(), "type": coarse.type},
                confidence=coarse.confidence,
                evidence=list(coarse.evidence),
                container_id=cid,
                image=image,
                created=created,
                ports=ports,
                mounts=mounts,
                ip_addresses=ip_addresses,
            )
        )
    return nodes


async def has_outline_ss_proxy() -> bool:
    """Detect outline-ss proxy container via image + cmd fingerprint."""
    for inspect in await docker_inspect_bulk():
        state = inspect.get("State") or {}
        if state.get("Status") != "running":
            continue
        image = (inspect.get("Config") or {}).get("Image") or inspect.get("Image") or ""
        entry = (inspect.get("Config") or {}).get("Entrypoint") or []
        cmd = (inspect.get("Config") or {}).get("Cmd") or []
        combined = " ".join([str(x) for x in (entry if isinstance(entry, list) else [entry]) + (cmd if isinstance(cmd, list) else [cmd])]).lower()
        if "alpine/socat" in image.lower() and "19092" in combined:
            return True
    return False


async def discover_host_wg() -> list[DiscoveredNode]:
    nodes: list[DiscoveredNode] = []
    host_id = _ensure_host_id()
    wg_list = await host_wg_dump()
    for w in wg_list:
        iface = w.get("interface") or "unknown"
        node_id = f"host:{iface}"
        nodes.append(
            DiscoveredNode(
                host_id=host_id,
                node_id=node_id,
                source="host",
                kind="host_wg",
                classification={
                    "kind": "host_wg",
                    "evidence": ["wg_show_all"],
                    "total_confidence": 1.0,
                    "type": "awg-node",
                },
                confidence=1.0,
                evidence=["wg_show_all"],
                interface=iface,
                public_key=w.get("public_key"),
            )
        )
    return nodes


async def run_discovery(
    outline_info: dict[str, Any] | None = None,
) -> list[DiscoveredNode]:
    docker_nodes = await discover_docker(outline_info=outline_info)
    host_nodes = await discover_host_wg()
    return docker_nodes + host_nodes
