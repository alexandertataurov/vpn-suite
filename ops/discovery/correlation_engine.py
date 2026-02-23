"""Correlate Outline servers with Docker/host nodes. Evidence-based."""

from __future__ import annotations

import socket
from dataclasses import dataclass, field
from typing import Any


def _resolve_hostname(hostname: str) -> list[str]:
    """Resolve hostname to IPs. Returns empty list on failure."""
    if not hostname or hostname.strip() == "":
        return []
    h = hostname.strip()
    if ":" in h:
        h = h.split(":")[0]
    try:
        addrs = socket.getaddrinfo(h, None, socket.AF_INET)
        return [a[4][0] for a in addrs if a[4]]
    except (socket.gaierror, socket.error, OSError, ValueError):
        return []


def _is_ip(s: str) -> bool:
    try:
        parts = s.strip().split(".")
        return len(parts) == 4 and all(0 <= int(p) <= 255 for p in parts if p.isdigit())
    except (ValueError, AttributeError):
        return False


@dataclass
class MappingEntry:
    outline_server_id: str
    host_id: str
    container_id: str | None
    node_id: str | None
    confidence: float
    evidence: list[str] = field(default_factory=list)

    def to_dict(self) -> dict[str, Any]:
        return {
            "outline_server_id": self.outline_server_id,
            "host_id": self.host_id,
            "container_id": self.container_id,
            "node_id": self.node_id,
            "confidence": round(self.confidence, 3),
            "evidence": self.evidence,
        }


def correlate(
    outline_servers: list[dict[str, Any]],
    discovered_nodes: list[dict[str, Any]],
    host_nic_ips: list[str] | None = None,
) -> list[dict[str, Any]]:
    """
    Match Outline servers to discovered nodes by IP, port, image, timestamp.
    Returns mapping entries. No guessing. Confidence >= 0.7 required.
    """
    mapping: list[dict[str, Any]] = []
    outline_nodes = [n for n in discovered_nodes if n.get("kind") == "outline"]
    nic_ips = set(host_nic_ips or [])

    for svr in outline_servers:
        if not isinstance(svr, dict):
            continue
        sid = svr.get("serverId") or svr.get("server_id") or "unknown"
        hostname = (svr.get("hostnameForAccessKeys") or svr.get("hostname") or "").strip()
        port_raw = svr.get("portForNewAccessKeys") or svr.get("port")
        try:
            port = int(port_raw) if port_raw is not None else None
        except (TypeError, ValueError):
            port = None
        created_ms = svr.get("createdTimestampMs") or svr.get("createdTimestamp")

        server_ips: set[str] = set()
        if _is_ip(hostname):
            server_ips.add(hostname)
        else:
            server_ips.update(_resolve_hostname(hostname))

        best: MappingEntry | None = None
        for node in outline_nodes:
            evidence: list[str] = []
            conf = 0.0
            if node.get("kind") == "outline":
                evidence.append("kind_outline")
                conf = 0.5
            if server_ips and nic_ips and server_ips & nic_ips:
                evidence.append("ip_match")
                conf += 0.4
            ports = node.get("ports") or []
            for p in ports:
                if isinstance(p, dict) and port is not None and p.get("port") == port:
                    evidence.append("port_match")
                    conf += 0.25
                elif isinstance(p, dict) and p.get("port") in (25432, 8081):
                    evidence.append("port_sb_default")
                    conf += 0.15
            classification = node.get("classification") or {}
            for ev in classification.get("evidence") or []:
                if ev in ("image_shadowbox", "env_sb", "label_outline", "mount_outline"):
                    evidence.append("fingerprint_match")
                    conf += 0.2
                    break
            if created_ms and node.get("created"):
                evidence.append("timestamp_proximity")
                conf += 0.1
            if conf > (best.confidence if best else 0):
                best = MappingEntry(
                    outline_server_id=sid,
                    host_id=node.get("host_id", "local"),
                    container_id=node.get("container_id"),
                    node_id=node.get("node_id"),
                    confidence=min(1.0, conf),
                    evidence=evidence,
                )
        if best and best.confidence >= 0.7:
            mapping.append(best.to_dict())
        else:
            mapping.append({
                "outline_server_id": sid,
                "host_id": "unresolved",
                "container_id": None,
                "node_id": None,
                "confidence": 0.0,
                "evidence": ["no_match"],
            })
    return mapping
