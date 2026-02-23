"""Fingerprint-based classification. No container names."""

from __future__ import annotations

import re
from datetime import datetime, timezone
from dataclasses import dataclass, field
from typing import Any

# Known image patterns (digest or repo:tag). Never use container name.
SHADOWBOX_IMAGE_PATTERNS = [
    r"outline/shadowbox",
    r"quay\.io/outline/shadowbox",
]
AMNEZIA_IMAGE_PATTERNS = [
    r"amnezia[wgvpn/\-]*",
    r"amneziawg",
    r"metaligh/amneziawg",
    r"amneziavpn/amneziawg",
]
PROMETHEUS_IMAGE_PATTERNS = [
    r"prom/prometheus",
]
EXPORTER_IMAGE_PATTERNS = [
    r"prom/node-exporter",
    r"gcr\.io/cadvisor/cadvisor",
    r"grafana/loki",
    r"grafana/promtail",
    r"vpn-suite-node-agent",
    r"vpn-suite-telegram-vpn-bot",
    r"outline-poller",
    r"wg-exporter",
]


@dataclass
class ClassificationResult:
    kind: str  # awg | outline | host_wg | unknown
    fingerprint_score: float = 0.0
    network_score: float = 0.0
    api_match_score: float = 0.0
    temporal_score: float = 0.0
    evidence: list[str] = field(default_factory=list)

    @property
    def total_confidence(self) -> float:
        w = (0.4, 0.3, 0.2, 0.1)
        return min(1.0, (
            w[0] * self.fingerprint_score + w[1] * self.network_score
            + w[2] * self.api_match_score + w[3] * self.temporal_score
        ))

    def to_dict(self) -> dict[str, Any]:
        return {
            "kind": self.kind,
            "fingerprint_score": round(self.fingerprint_score, 3),
            "network_score": round(self.network_score, 3),
            "api_match_score": round(self.api_match_score, 3),
            "temporal_score": round(self.temporal_score, 3),
            "total_confidence": round(self.total_confidence, 3),
            "evidence": self.evidence,
        }


@dataclass
class CandidateClassification:
    type: str  # awg-node | outline-shadowbox | exporter | prometheus | unknown
    confidence: float
    evidence: list[str] = field(default_factory=list)

    def to_dict(self) -> dict[str, Any]:
        return {
            "type": self.type,
            "confidence": round(self.confidence, 3),
            "evidence": self.evidence,
        }


def _match(s: str, patterns: list[str]) -> bool:
    if not s:
        return False
    low = s.lower()
    return any(re.search(p, low, re.I) for p in patterns)


def _image(inspect: dict[str, Any]) -> str:
    return (inspect.get("Config") or {}).get("Image") or inspect.get("Image") or ""


def _entrypoint_cmd(inspect: dict[str, Any]) -> str:
    cfg = inspect.get("Config") or {}
    ep = cfg.get("Entrypoint") or []
    cmd = cfg.get("Cmd") or []
    a = ep if isinstance(ep, (list, tuple)) else [ep]
    b = cmd if isinstance(cmd, (list, tuple)) else [cmd]
    return " ".join(str(x) for x in a + b).lower()


def _ports(inspect: dict[str, Any]) -> set[tuple[str, int]]:
    out: set[tuple[str, int]] = set()
    for raw in (inspect.get("NetworkSettings") or {}).get("Ports") or {}:
        if "/" in raw:
            ps, proto = raw.rsplit("/", 1)
            try:
                out.add((proto.lower(), int(ps)))
            except ValueError:
                pass
    exp = (inspect.get("Config") or {}).get("ExposedPorts") or {}
    for raw in exp:
        if "/" in raw:
            ps, proto = raw.rsplit("/", 1)
            try:
                out.add((proto.lower(), int(ps)))
            except ValueError:
                pass
    pb = (inspect.get("HostConfig") or {}).get("PortBindings") or {}
    for raw in pb:
        if "/" in raw:
            ps, proto = raw.rsplit("/", 1)
            try:
                out.add((proto.lower(), int(ps)))
            except ValueError:
                pass
    return out


def _mounts(inspect: dict[str, Any]) -> list[str]:
    return [m.get("Destination") or m.get("dest") or "" for m in inspect.get("Mounts") or []
            if isinstance(m, dict)]


def _env(inspect: dict[str, Any]) -> dict[str, str]:
    out = {}
    for e in (inspect.get("Config") or {}).get("Env") or []:
        if isinstance(e, str) and "=" in e:
            k, _, v = e.partition("=")
            out[k.strip()] = v.strip()
    return out


def _labels(inspect: dict[str, Any]) -> dict[str, str]:
    return dict((inspect.get("Config") or {}).get("Labels") or {})


def _network_mode(inspect: dict[str, Any]) -> str:
    return str((inspect.get("HostConfig") or {}).get("NetworkMode") or "").lower()


def _parse_created_ts(created: str | None) -> float | None:
    """Parse container Created (ISO) to unix timestamp."""
    if not created:
        return None
    try:
        s = str(created).strip().replace("Z", "+00:00")
        if "." in s and "+" not in s and "Z" not in s:
            s = s.split(".")[0] + "+00:00"
        dt = datetime.fromisoformat(s)
        if dt.tzinfo is None:
            dt = dt.replace(tzinfo=timezone.utc)
        return dt.timestamp()
    except (ValueError, TypeError):
        return None


def classify_container(
    host_id: str,
    container_id: str,
    inspect: dict[str, Any],
    *,
    outline_info: dict[str, Any] | None = None,
    repo_digests: list[str] | None = None,
    image_id: str | None = None,
) -> ClassificationResult:
    image = _image(inspect)
    all_image_refs = [image]
    if repo_digests:
        all_image_refs.extend(repo_digests)
    if image_id:
        all_image_refs.append(image_id)
    combined = f"{image} {_entrypoint_cmd(inspect)}"
    network_mode = _network_mode(inspect)
    ports = _ports(inspect)
    mounts = _mounts(inspect)
    env = _env(inspect)
    labels = _labels(inspect)

    fp, net, api, temporal = 0.0, 0.0, 0.0, 0.0
    evidence: list[str] = []
    kind = "unknown"

    if any(_match(r, SHADOWBOX_IMAGE_PATTERNS) for r in all_image_refs if r):
        fp, kind = 1.0, "outline"
        evidence.append("image_shadowbox")
    if env.get("SB_STATE_DIR") or env.get("SB_API_PORT"):
        fp = max(fp, 0.95)
        evidence.append("env_sb")
        kind = "outline"
    if labels.get("com.centurylinklabs.watchtower.scope") == "outline":
        fp = max(fp, 0.85)
        evidence.append("label_outline")
        kind = "outline"
    if any("/opt/outline" in m for m in mounts):
        fp = max(fp, 0.8)
        evidence.append("mount_outline")
        if kind == "unknown":
            kind = "outline"
    if network_mode == "host" and kind == "outline":
        fp = max(fp, 0.75)
        evidence.append("network_mode_host")
    if any(p[1] in (25432, int(env.get("SB_API_PORT", 0) or 0)) for p in ports if p[1]):
        net = max(net, 0.9)
        evidence.append("port_sb_api")

    if any(_match(r, AMNEZIA_IMAGE_PATTERNS) for r in all_image_refs if r):
        fp = max(fp, 1.0)
        evidence.append("image_amnezia")
        kind = "awg"
    if "amneziawg" in combined or "wg " in combined:
        fp = max(fp, 0.9)
        evidence.append("entrypoint_awg")
        kind = "awg"
    if any("/dev/net/tun" in m for m in mounts):
        fp = max(fp, 0.7)
        evidence.append("mount_tun")
        if kind == "unknown":
            kind = "awg"
    caps = (inspect.get("HostConfig") or {}).get("CapAdd") or []
    if "NET_ADMIN" in caps:
        fp = max(fp, 0.6)
        evidence.append("cap_net_admin")
        if kind == "unknown":
            kind = "awg"
    if any(proto == "udp" and 51820 <= port <= 52000 for proto, port in ports):
        net = max(net, 0.9)
        evidence.append("port_wg_udp")

    if outline_info and kind == "outline":
        api = 0.8
        evidence.append("outline_api_correlation")

    created_ts = _parse_created_ts(inspect.get("Created"))
    created_ms = None
    if outline_info and isinstance(outline_info, dict):
        cm = outline_info.get("createdTimestampMs") or outline_info.get("createdTimestamp")
        if cm is not None:
            try:
                created_ms = float(cm)
            except (TypeError, ValueError):
                pass
    if created_ts is not None and created_ms is not None:
        api_ts = created_ms / 1000.0
        diff_sec = abs(created_ts - api_ts)
        if diff_sec < 3600:
            temporal = 0.9
            evidence.append("timestamp_proximity")

    if kind == "unknown" and (fp > 0 or net > 0):
        kind = "awg" if any(p[0] == "udp" for p in ports) else "outline"

    return ClassificationResult(
        kind=kind,
        fingerprint_score=fp,
        network_score=net,
        api_match_score=api,
        temporal_score=temporal,
        evidence=evidence,
    )


def classify_candidate(
    host_id: str,
    container_id: str,
    inspect: dict[str, Any],
    *,
    outline_info: dict[str, Any] | None = None,
    repo_digests: list[str] | None = None,
    image_id: str | None = None,
) -> CandidateClassification:
    """Return coarse classification used by discovery + telemetry targets."""
    image = _image(inspect)
    all_image_refs = [image]
    if repo_digests:
        all_image_refs.extend(repo_digests)
    if image_id:
        all_image_refs.append(image_id)
    if any(_match(r, PROMETHEUS_IMAGE_PATTERNS) for r in all_image_refs if r):
        return CandidateClassification(type="prometheus", confidence=0.9, evidence=["image_prometheus"])
    if any(_match(r, EXPORTER_IMAGE_PATTERNS) for r in all_image_refs if r):
        return CandidateClassification(type="exporter", confidence=0.9, evidence=["image_exporter"])

    detailed = classify_container(
        host_id,
        container_id,
        inspect,
        outline_info=outline_info,
        repo_digests=repo_digests,
        image_id=image_id,
    )
    if detailed.kind == "awg":
        awg_conf = detailed.total_confidence
        if "image_amnezia" in detailed.evidence:
            awg_conf = max(awg_conf, 0.75)
        return CandidateClassification(
            type="awg-node",
            confidence=awg_conf,
            evidence=detailed.evidence,
        )
    if detailed.kind == "outline":
        outline_conf = detailed.total_confidence
        if {"image_shadowbox", "env_sb", "mount_outline"} & set(detailed.evidence):
            outline_conf = max(outline_conf, 0.85)
        return CandidateClassification(
            type="outline-shadowbox",
            confidence=outline_conf,
            evidence=detailed.evidence,
        )
    return CandidateClassification(
        type="unknown",
        confidence=max(detailed.total_confidence, 0.1),
        evidence=detailed.evidence or ["no_match"],
    )
