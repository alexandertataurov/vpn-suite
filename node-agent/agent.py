#!/usr/bin/env python3
"""Node Agent (pull-based).

Responsibilities:
- Discover local AmneziaWG containers.
- Collect runtime state via `docker exec ... awg show <iface> dump`.
- Pull desired peers from control-plane.
- Reconcile runtime peers with desired state via `docker exec ... awg set ...`.
- Push heartbeat to control-plane.
- Expose /metrics and /healthz (Prometheus).

Security notes:
- In production, run agent behind outbound-only network policy.
- Use mTLS on the control-plane agent endpoint; keep X-Agent-Token as defense-in-depth.
- The docker socket is local-only. Mounting it as :ro does not meaningfully restrict API operations.
"""

from __future__ import annotations

import ipaddress
import json
import os
import random
import re
import uuid
import signal
import subprocess
import threading
import time
from concurrent.futures import ThreadPoolExecutor, as_completed
from dataclasses import dataclass
from datetime import datetime, timezone
from http.server import BaseHTTPRequestHandler, HTTPServer
from typing import Any
from urllib.parse import urljoin

import requests
import urllib3
from prometheus_client import CONTENT_TYPE_LATEST, Counter, Gauge, Histogram, generate_latest

if os.getenv("TLS_INSECURE_SKIP_VERIFY", "").strip().lower() in ("1", "true", "yes"):
    urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)

try:
    import docker
    _DOCKER_SDK_AVAILABLE = True
except ImportError:
    _DOCKER_SDK_AVAILABLE = False

_CONTAINER_NAME_RE = re.compile(r"^[a-zA-Z0-9][a-zA-Z0-9_.-]{0,127}$")
_INTERFACE_NAME_RE = re.compile(r"^[a-zA-Z0-9_.:-]{1,32}$")
_PUBKEY_RE = re.compile(r"^[A-Za-z0-9+/=]{32,64}$")


@dataclass
class ContainerCandidate:
    container_id: str
    name: str
    image: str
    confidence: float
    evidence: list[str]


def _env_int(name: str, default: int) -> int:
    raw = os.getenv(name, str(default)).strip()
    try:
        return int(raw)
    except ValueError:
        return default


def _env_float(name: str, default: float) -> float:
    raw = os.getenv(name, str(default)).strip()
    try:
        return float(raw)
    except ValueError:
        return default


def _now_utc() -> datetime:
    return datetime.now(timezone.utc)


def _iso_utc(dt: datetime) -> str:
    return dt.astimezone(timezone.utc).isoformat()


def _host_id() -> str:
    env = os.getenv("HOST_ID", "").strip()
    if env:
        return env
    try:
        with open("/etc/vpn-suite/node-id", "r", encoding="utf-8") as f:
            v = f.read().strip()
            if v:
                return v
    except Exception:
        pass
    return "local"


def _sanitize_container(name: str) -> str:
    n = (name or "").strip()
    if not _CONTAINER_NAME_RE.fullmatch(n):
        raise ValueError("invalid container name")
    return n


def _sanitize_iface(name: str) -> str:
    n = (name or "").strip()
    if not _INTERFACE_NAME_RE.fullmatch(n):
        raise ValueError("invalid interface name")
    return n


def _sanitize_pubkey(key: str) -> str:
    k = (key or "").strip()
    if not _PUBKEY_RE.fullmatch(k):
        raise ValueError("invalid public key")
    return k


@dataclass
class Peer:
    public_key: str
    allowed_ips: str
    last_handshake_ts: int
    rx: int
    tx: int
    endpoint: str


@dataclass
class RuntimeState:
    ok: bool
    container_name: str
    interface_name: str
    public_key: str
    listen_port: int
    peers: list[Peer]
    total_rx: int
    total_tx: int
    last_handshake_max_age_sec: int | None
    active_peers: int
    latency_ms: float
    error: str | None = None


METRIC_DOCKER_EXEC_LATENCY = Histogram(
    "agent_docker_exec_latency_seconds",
    "Latency of docker exec operations",
    ["op"],
    buckets=(0.01, 0.05, 0.1, 0.25, 0.5, 1.0, 2.5, 5.0, 10.0),
)
METRIC_RECONCILE_DURATION = Histogram(
    "agent_reconcile_duration_seconds",
    "Reconcile cycle duration",
    buckets=(0.1, 0.25, 0.5, 1.0, 2.0, 5.0, 10.0, 30.0),
)
METRIC_RECONCILE_ERRORS = Counter(
    "agent_reconcile_errors_total",
    "Reconcile errors",
    ["stage"],
)
METRIC_HEARTBEAT_OK = Gauge(
    "agent_last_heartbeat_ok",
    "1 if last heartbeat succeeded, else 0",
)
METRIC_LAST_SUCCESS_TS = Gauge(
    "agent_last_success_ts",
    "Unix timestamp of last successful heartbeat+reconcile",
)
METRIC_PEERS_DESIRED = Gauge("agent_peers_desired", "Desired peers count")
METRIC_PEERS_RUNTIME = Gauge("agent_peers_runtime", "Runtime peers count")
METRIC_PEERS_ACTIVE = Gauge("agent_peers_active", "Active peers count (handshake <= threshold)")
METRIC_ORPHAN_PEERS = Gauge("agent_orphan_peers", "Peers in runtime but not in desired state")
METRIC_DRIFT_PEERS = Gauge("agent_drift_peers", "Peers in runtime needing update")
METRIC_HANDSHAKE_MAX_AGE = Gauge("agent_last_handshake_max_age_seconds", "Max handshake age across peers")
METRIC_HANDSHAKE_AGE = Histogram(
    "agent_peer_handshake_age_seconds",
    "Per-peer handshake age seconds (from runtime dump)",
    buckets=(10, 30, 60, 120, 300, 600, 1800, 3600, 7200, 21600, 43200, 86400),
)
METRIC_PEER_ENDPOINT_CHANGES = Counter(
    "agent_peer_endpoint_changes_total",
    "Peer endpoint changes observed (best-effort)",
)
METRIC_PEER_ROAMING = Counter(
    "agent_peer_roaming_total",
    "Peer roaming events observed (best-effort)",
)

METRIC_PEER_MUTATIONS = Counter(
    "agent_peer_mutations_total",
    "Peer mutations applied by node-agent",
    ["type"],  # add|remove|update
)
METRIC_PEER_PRUNE_BLOCKED = Counter(
    "agent_peer_prune_blocked_total",
    "Peer prune operations blocked by safety checks",
    ["reason"],
)

METRIC_HTTP_REQUESTS_TOTAL = Counter(
    "agent_http_requests_total",
    "HTTP requests from node-agent to control-plane",
    ["endpoint", "method", "status_class"],
)
METRIC_HTTP_REQUEST_LATENCY_SECONDS = Histogram(
    "agent_http_request_latency_seconds",
    "Latency of node-agent HTTP requests to control-plane",
    ["endpoint", "method"],
    buckets=(0.05, 0.1, 0.25, 0.5, 1.0, 2.0, 5.0, 10.0),
)

# Per-peer RTT (real measurement from node via ping to tunnel IP). Names align with control-plane.
METRIC_PEER_RTT_MS = Gauge(
    "vpn_peer_rtt_ms",
    "Per-peer RTT from ping to tunnel IP (ms); only active peers.",
    ["node", "peer"],
)
METRIC_PEER_RTT_FAILURES = Counter(
    "vpn_peer_rtt_failures_total",
    "RTT ping failures (timeout or error)",
    ["node"],
)

# RTT cache: (container_id, public_key) -> rtt_ms (float) or None. Updated by RTT worker.
_RTT_CACHE: dict[tuple[str, str], float | None] = {}
_RTT_CACHE_LOCK = threading.Lock()
_RTT_ACTIVE_AGE_SEC = 180  # Only measure peers with handshake < 3 min


def _rtt_tunnel_subnet() -> tuple[ipaddress.IPv4Network | None, str]:
    """Parse RTT_TUNNEL_CIDR (e.g. 10.8.0.0/16). Returns (network, raw_cidr)."""
    cidr = (os.getenv("RTT_TUNNEL_CIDR", "10.8.0.0/16") or "10.8.0.0/16").strip()
    try:
        net = ipaddress.ip_network(cidr, strict=False)
        if isinstance(net, ipaddress.IPv4Network):
            return net, cidr
    except ValueError:
        pass
    return None, cidr


def _ip_in_subnet(ip_str: str, network: ipaddress.IPv4Network | None) -> bool:
    if not network:
        return False
    try:
        addr = ipaddress.ip_address(ip_str.strip())
        if isinstance(addr, ipaddress.IPv4Address):
            return addr in network
    except ValueError:
        pass
    return False


def _extract_tunnel_ip(allowed_ips: str, network: ipaddress.IPv4Network | None) -> str | None:
    """Extract first IPv4 from allowed_ips that lies in the tunnel subnet. No shell, validated."""
    if not allowed_ips or not network:
        return None
    for part in (p.strip() for p in allowed_ips.split(",") if p.strip()):
        if "/" in part:
            ip_part = part.split("/")[0].strip()
        else:
            ip_part = part
        if not ip_part or not re.match(r"^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$", ip_part):
            continue
        if _ip_in_subnet(ip_part, network):
            return ip_part
    return None


def _parse_ping_time_ms(output: str) -> float | None:
    """Parse 'time=23.4 ms' or 'time = 23.4 ms' from ping output. Returns None if not found."""
    for line in (output or "").splitlines():
        m = re.search(r"time[=\s]+([0-9.]+)\s*ms", line, re.IGNORECASE)
        if m:
            try:
                v = float(m.group(1))
                return v if v >= 0 else None
            except ValueError:
                pass
    return None


def _ping_peer_rtt(container_id: str, ip: str, timeout_sec: float) -> float | None:
    """Run ping inside container to tunnel IP. Returns RTT in ms or None. No shell, args only."""
    try:
        container_id = _sanitize_container(container_id)
        timeout_arg = str(max(1, min(5, int(timeout_sec))))
        cmd = ["docker", "exec", container_id, "ping", "-c", "1", "-W", timeout_arg, ip]
        code, out, _ = _run(cmd, timeout=timeout_sec + 2.0)
        if code != 0:
            return None
        return _parse_ping_time_ms(out)
    except Exception:
        return None


def _rtt_worker_loop(
    container_filter: str,
    explicit_container: str | None,
    iface: str,
    docker_timeout: float,
    scan_interval_sec: float,
    max_concurrent: int,
    ping_timeout_sec: float,
) -> None:
    """Background loop: every scan_interval_sec (+ jitter) measure RTT for active peers. Non-blocking."""
    network, _ = _rtt_tunnel_subnet()
    if not network:
        return
    while True:
        try:
            time.sleep(scan_interval_sec + random.uniform(0, 2))
        except Exception:
            break
        try:
            containers = _pick_containers(container_filter, explicit_container, timeout=docker_timeout)
        except Exception:
            continue
        tasks: list[tuple[str, str, str, str]] = []  # (container_id, container_name, public_key, ip)
        now_ts = int(_now_utc().timestamp())
        for c in containers:
            try:
                rt = _runtime_state(
                    container=c.container_id,
                    display_name=c.name,
                    iface=iface,
                    docker_timeout=docker_timeout,
                    active_age_sec=_RTT_ACTIVE_AGE_SEC,
                )
                if not rt.ok or not rt.peers:
                    continue
                for p in rt.peers:
                    if p.last_handshake_ts <= 0:
                        continue
                    age = now_ts - p.last_handshake_ts
                    if age > _RTT_ACTIVE_AGE_SEC:
                        continue
                    ip = _extract_tunnel_ip(p.allowed_ips, network)
                    if ip:
                        tasks.append((c.container_id, c.name, p.public_key, ip))
            except Exception:
                continue
        if not tasks:
            continue
        # Limit concurrency; process in batches of max_concurrent
        results: list[tuple[str, str, str, float | None]] = []
        with ThreadPoolExecutor(max_workers=max_concurrent) as ex:
            futures = {
                ex.submit(_ping_peer_rtt, cid, ip, ping_timeout_sec): (cid, cname, pk, ip)
                for cid, cname, pk, ip in tasks
            }
            for fut in as_completed(futures, timeout=ping_timeout_sec * 2 + 10):
                cid, cname, pk, _ = futures[fut]
                try:
                    rtt = fut.result()
                    results.append((cid, cname, pk, rtt))
                except Exception:
                    results.append((cid, cname, pk, None))
        with _RTT_CACHE_LOCK:
            for cid, cname, pk, rtt in results:
                key = (cid, pk)
                _RTT_CACHE[key] = rtt
                if rtt is not None:
                    METRIC_PEER_RTT_MS.labels(node=cname, peer=pk[:12]).set(rtt)
                else:
                    METRIC_PEER_RTT_FAILURES.labels(node=cname).inc()
            # Prune cache for peers no longer in this scan
            seen = {(cid, pk) for cid, _, pk, _ in results}
            for key in list(_RTT_CACHE):
                if key not in seen:
                    del _RTT_CACHE[key]
    return None


def _get_peer_rtt_ms(container_id: str, public_key: str) -> float | None:
    """Return cached RTT (ms) for peer; None if not measured or failed. Never return 0 unless real."""
    with _RTT_CACHE_LOCK:
        return _RTT_CACHE.get((container_id, public_key))


class _State:
    def __init__(self) -> None:
        self.lock = threading.Lock()
        self.last_ok_time: float = 0.0
        self.last_err: str | None = None
        self.last_container: str = ""
        self.last_runtime_peers: int = 0
        self.last_desired_peers: int = 0
        self.last_peer_endpoints: dict[str, str] = {}
        self.network_check_cache: dict[str, tuple[float, list[str]]] = {}


STATE = _State()


def _log(event: str, correlation_id: str | None = None, **fields: Any) -> None:
    from log_utils import log_info, log_error
    ev_map = {
        "heartbeat_fail": "agent.heartbeat.failed",
        "action_failed": "agent.action.failed",
        "error": "agent.error",
    }
    ev = ev_map.get(event, f"agent.{event}")
    logger_fn = log_error if event in ("heartbeat_fail", "action_failed", "error") else log_info
    msg = ev.replace("_", " ").replace(".", " ")
    clean: dict[str, Any] = {k: v for k, v in fields.items() if v is not None}
    logger_fn(msg, event=ev, correlation_id=correlation_id, **clean)


def _run(cmd: list[str], *, timeout: float) -> tuple[int, str, float]:
    started = time.perf_counter()
    try:
        p = subprocess.run(
            cmd,
            stdout=subprocess.PIPE,
            stderr=subprocess.STDOUT,
            timeout=timeout,
            check=False,
            text=True,
        )
        out = p.stdout or ""
        return p.returncode, out, (time.perf_counter() - started) * 1000.0
    except subprocess.TimeoutExpired:
        return 124, "command timed out", (time.perf_counter() - started) * 1000.0


def _norm_container_name(name: str) -> str:
    """Strip leading slash if present (e.g. docker inspect returns /name)."""
    n = (name or "").strip()
    if n.startswith("/"):
        n = n[1:]
    return n


def _docker_ps_names(*, timeout: float) -> list[str]:
    code, out, latency_ms = _run(["docker", "ps", "--format", "{{.Names}}"], timeout=timeout)
    METRIC_DOCKER_EXEC_LATENCY.labels(op="docker_ps").observe(latency_ms / 1000.0)
    if code != 0:
        return []
    names = [_norm_container_name(line) for line in out.splitlines() if line.strip()]
    return sorted(n for n in names if n)


def _docker_ps_names_and_images_sdk() -> list[tuple[str, str]]:
    """List (name, image) using Docker SDK when available. Names normalized (no leading slash)."""
    if not _DOCKER_SDK_AVAILABLE:
        return []
    try:
        client = docker.from_env()
        containers = client.containers.list()
        pairs = []
        for c in containers:
            name = _norm_container_name(getattr(c, "name", "") or "")
            if not name:
                continue
            img = ""
            try:
                if hasattr(c, "image") and c.image:
                    tags = getattr(c.image, "tags", None)
                    if tags:
                        img = tags[0] or ""
                    else:
                        img = getattr(c.image, "short_id", "") or ""
            except Exception:
                pass
            if not img and hasattr(c, "attrs"):
                img = (c.attrs.get("Config") or {}).get("Image") or ""
            pairs.append((name, img))
        return sorted(pairs, key=lambda x: x[0])
    except Exception:
        return []


def _docker_ps_names_and_images(*, timeout: float) -> list[tuple[str, str]]:
    """Return list of (name, image) for running containers. Prefer Docker SDK; fallback to CLI."""
    start = time.perf_counter()
    pairs = _docker_ps_names_and_images_sdk()
    if pairs:
        METRIC_DOCKER_EXEC_LATENCY.labels(op="docker_ps").observe(time.perf_counter() - start)
        return pairs
    code, out, latency_ms = _run(
        ["docker", "ps", "--format", "{{.Names}}\t{{.Image}}"],
        timeout=timeout,
    )
    METRIC_DOCKER_EXEC_LATENCY.labels(op="docker_ps").observe(latency_ms / 1000.0)
    if code != 0:
        return []
    result = []
    for line in out.splitlines():
        parts = line.strip().split("\t", 1)
        name = _norm_container_name(parts[0] if parts else "")
        image = (parts[1] if len(parts) > 1 else "").strip()
        if name:
            result.append((name, image))
    return sorted(result, key=lambda x: x[0])


def _docker_inspect_all(*, timeout: float) -> list[dict[str, Any]]:
    code, out, _ = _run(["docker", "ps", "-q"], timeout=timeout)
    if code != 0 or not out.strip():
        return []
    ids = [x.strip() for x in out.splitlines() if x.strip()]
    if not ids:
        return []
    code2, out2, _ = _run(["docker", "inspect"] + ids, timeout=max(15.0, timeout * 3))
    if code2 != 0:
        return []
    try:
        data = json.loads(out2)
        return data if isinstance(data, list) else []
    except Exception:
        return []


def _extract_ports(inspect: dict[str, Any]) -> list[tuple[str, int]]:
    out: list[tuple[str, int]] = []
    seen: set[tuple[str, int]] = set()
    ports_raw = (inspect.get("NetworkSettings") or {}).get("Ports") or {}
    exp = (inspect.get("Config") or {}).get("ExposedPorts") or {}
    for raw in list(exp) + list(ports_raw):
        if "/" in str(raw):
            ps, proto = str(raw).rsplit("/", 1)
            if ps.isdigit():
                key = (proto.lower(), int(ps))
                if key not in seen:
                    seen.add(key)
                    out.append(key)
    return out


def _classify_awg_candidate(inspect: dict[str, Any]) -> tuple[float, list[str]]:
    image = ((inspect.get("Config") or {}).get("Image") or inspect.get("Image") or "").lower()
    entry = " ".join(
        [str(x) for x in ((inspect.get("Config") or {}).get("Entrypoint") or []) + ((inspect.get("Config") or {}).get("Cmd") or [])]
    ).lower()
    mounts = [m.get("Destination") for m in inspect.get("Mounts") or [] if isinstance(m, dict)]
    caps = (inspect.get("HostConfig") or {}).get("CapAdd") or []
    ports = _extract_ports(inspect)

    conf = 0.0
    evidence: list[str] = []
    if "amnezia" in image or "awg" in image:
        conf = max(conf, 0.7)
        evidence.append("image_amnezia")
    if "amneziawg" in entry or "wg " in entry or "awg" in entry:
        conf = max(conf, 0.6)
        evidence.append("entrypoint_awg")
    if any(m and "/dev/net/tun" in m for m in mounts):
        conf = max(conf, 0.5)
        evidence.append("mount_tun")
    if "NET_ADMIN" in caps or "CAP_NET_ADMIN" in caps:
        conf = max(conf, 0.5)
        evidence.append("cap_net_admin")
    if any(proto == "udp" and 51820 <= port <= 52000 for proto, port in ports):
        conf = max(conf, 0.7)
        evidence.append("port_wg_udp")
    return conf, evidence


def _is_awg_image(image: str) -> bool:
    """True if image name suggests AmneziaWG (amnezia/amneziawg, *awg*, etc.)."""
    if not image:
        return False
    low = image.lower()
    return "amnezia" in low or "awg" in low


def _is_awg_container_name(name: str) -> bool:
    """True if container name suggests AmneziaWG (e.g. amnezia-awg, *awg*)."""
    if not name:
        return False
    low = name.lower()
    return "amnezia" in low or "awg" in low


def _probe_awg(container: str, iface: str = "awg0", *, timeout: float = 3.0) -> bool:
    """Return True if container runs 'awg show <iface> dump' successfully (is an AWG node)."""
    try:
        container = _sanitize_container(container)
        iface = _sanitize_iface(iface)
    except ValueError:
        return False
    code, _, _ = _run(["docker", "exec", container, "awg", "show", iface, "dump"], timeout=timeout)
    return code == 0


def _pick_container(container_filter: str, explicit: str | None, *, timeout: float) -> ContainerCandidate | None:
    """Return first matching container (legacy single-container)."""
    containers = _pick_containers(container_filter, explicit, timeout=timeout)
    return containers[0] if containers else None


def _pick_containers(container_filter: str, explicit: str | None, *, timeout: float) -> list[ContainerCandidate]:
    """Return all matching containers using fingerprints (no names as primary)."""
    raw = (container_filter or "").strip().lower()
    inspect_rows = _docker_inspect_all(timeout=timeout)
    out: list[ContainerCandidate] = []

    for ins in inspect_rows:
        state = ins.get("State") or {}
        if state.get("Status") != "running":
            continue
        cid = (ins.get("Id") or "")[:12]
        name = (ins.get("Name") or "").lstrip("/")
        image = (ins.get("Config") or {}).get("Image") or ins.get("Image") or ""
        if not cid or not name:
            continue
        if explicit and explicit not in (cid, name):
            continue
        conf, evidence = _classify_awg_candidate(ins)
        if conf < 0.6:
            # Probe to avoid false negatives.
            probe_timeout = min(3.0, max(1.0, timeout))
            if _probe_awg(cid, "awg0", timeout=probe_timeout):
                conf = max(conf, 0.8)
                evidence.append("probe_awg")
        if conf >= 0.6:
            out.append(ContainerCandidate(container_id=cid, name=name, image=image, confidence=conf, evidence=evidence))

    if raw not in ("", "auto"):
        prefixes = [p.strip() for p in raw.split(",") if p.strip()]
        if prefixes:
            # Use name prefixes only as fallback to include user-specified containers.
            for ins in inspect_rows:
                name = (ins.get("Name") or "").lstrip("/")
                cid = (ins.get("Id") or "")[:12]
                image = (ins.get("Config") or {}).get("Image") or ins.get("Image") or ""
                if not cid or not name:
                    continue
                if any(name.startswith(p) for p in prefixes):
                    if not any(c.container_id == cid for c in out):
                        out.append(ContainerCandidate(container_id=cid, name=name, image=image, confidence=0.4, evidence=["name_prefix_fallback"]))

    return sorted(out, key=lambda c: c.name)


def _server_id_from_container(container_name: str, max_len: int = 32) -> str:
    """Sanitize container name to a valid server_id (alphanumeric, hyphen, underscore; max 32 chars)."""
    s = "".join(c if c.isalnum() or c in "-_" else "_" for c in container_name)
    return s[:max_len] or "container"


def _parse_dump(dump: str) -> tuple[str, int, list[Peer]]:
    lines = [ln for ln in (dump or "").splitlines() if ln.strip()]
    if not lines:
        return "", 0, []
    # wg/awg show <iface> dump:
    # interface line: private_key \t public_key \t listen_port \t fwmark
    iface_parts = lines[0].split("\t")
    public_key = iface_parts[1].strip() if len(iface_parts) > 1 else ""
    try:
        listen_port = int((iface_parts[2] or "0").strip()) if len(iface_parts) > 2 else 0
    except ValueError:
        listen_port = 0

    peers: list[Peer] = []
    for ln in lines[1:]:
        parts = ln.split("\t")
        if len(parts) < 8:
            continue
        pk = parts[0].strip()
        endpoint = (parts[2] or "").strip()
        allowed = (parts[3] or "").strip()
        try:
            hs = int((parts[4] or "0").strip())
        except ValueError:
            hs = 0
        try:
            rx = int((parts[5] or "0").strip())
        except ValueError:
            rx = 0
        try:
            tx = int((parts[6] or "0").strip())
        except ValueError:
            tx = 0
        if not pk:
            continue
        peers.append(
            Peer(
                public_key=pk,
                allowed_ips=allowed,
                last_handshake_ts=hs,
                rx=rx,
                tx=tx,
                endpoint=endpoint,
            )
        )
    return public_key, listen_port, peers


def _parse_wg_show_obfuscation(output: str) -> dict | None:
    """Parse `wg show <iface>` human output for H1–H4, S1, S2, Jc, Jmin, Jmax. Keys match backend."""
    result: dict = {}
    for line in (output or "").strip().splitlines():
        line = line.strip()
        if ":" not in line:
            continue
        key, _, val = line.partition(":")
        key, val = key.strip().lower(), val.strip()
        if key in ("jc", "jmin", "jmax"):
            try:
                result["Jc" if key == "jc" else "Jmin" if key == "jmin" else "Jmax"] = int(val)
            except ValueError:
                pass
        elif key in ("s1", "s2", "s3", "s4"):
            try:
                result["S1" if key == "s1" else "S2" if key == "s2" else "S3" if key == "s3" else "S4"] = int(val)
            except ValueError:
                pass
        elif key in ("h1", "h2", "h3", "h4") and val:
            v = val.strip()
            if v.isdigit():
                result["H1" if key == "h1" else "H2" if key == "h2" else "H3" if key == "h3" else "H4"] = int(v)
    return result if result else None


def _get_obfuscation_from_container(
    container: str, iface: str, docker_timeout: float
) -> dict | None:
    """Run wg show <iface> in container and return obfuscation dict (H1–H4, etc.) for heartbeat."""
    container = _sanitize_container(container)
    iface = _sanitize_iface(iface)
    code, out, _ = _run(["docker", "exec", container, "wg", "show", iface], timeout=docker_timeout)
    if code != 0:
        code, out, _ = _run(["docker", "exec", container, "awg", "show", iface], timeout=docker_timeout)
    if code != 0:
        return None
    return _parse_wg_show_obfuscation(out)


def _runtime_state(
    *,
    container: str,
    display_name: str | None = None,
    iface: str,
    docker_timeout: float,
    active_age_sec: int,
) -> RuntimeState:
    iface = _sanitize_iface(iface)
    container = _sanitize_container(container)
    code, out, latency_ms = _run(["docker", "exec", container, "awg", "show", iface, "dump"], timeout=docker_timeout)
    METRIC_DOCKER_EXEC_LATENCY.labels(op="awg_show_dump").observe(latency_ms / 1000.0)
    if code != 0:
        return RuntimeState(
            ok=False,
            container_name=display_name or container,
            interface_name=iface,
            public_key="",
            listen_port=0,
            peers=[],
            total_rx=0,
            total_tx=0,
            last_handshake_max_age_sec=None,
            active_peers=0,
            latency_ms=latency_ms,
            error=(out.strip()[:200] or f"docker exec failed code={code}"),
        )

    pub, port, peers = _parse_dump(out)
    total_rx = sum(p.rx for p in peers)
    total_tx = sum(p.tx for p in peers)

    now_ts = int(_now_utc().timestamp())
    active = 0
    max_age: int | None = None
    for p in peers:
        if p.last_handshake_ts > 0:
            age = max(0, now_ts - p.last_handshake_ts)
            max_age = age if max_age is None else max(max_age, age)
            if age <= active_age_sec:
                active += 1
                
    warnings = []
    # Network checks via cache (60s TTL)
    now = time.perf_counter()
    with STATE.lock:
        cache_ts, cache_warn = STATE.network_check_cache.get(container, (0.0, []))
        do_check = (now - cache_ts >= 60.0)
        if not do_check:
            warnings = list(cache_warn)

    if do_check:
        code, out, _ = _run(["docker", "exec", container, "sysctl", "net.ipv4.ip_forward"], timeout=docker_timeout)
        if code == 0 and "1" not in out:
            warnings.append("net.ipv4.ip_forward is not 1")
        
        code, out, _ = _run(["docker", "exec", container, "iptables", "-t", "nat", "-n", "-L", "POSTROUTING"], timeout=docker_timeout)
        if code == 0 and "MASQUERADE" not in out:
            warnings.append("missing MASQUERADE in iptables nat POSTROUTING")
            
        with STATE.lock:
            STATE.network_check_cache[container] = (now, warnings)

    error_msg = None
    if warnings:
        error_msg = " / ".join(warnings)
    return RuntimeState(
        ok=True,
        container_name=display_name or container,
        interface_name=iface,
        public_key=pub,
        listen_port=port,
        peers=peers,
        total_rx=total_rx,
        total_tx=total_tx,
        last_handshake_max_age_sec=max_age,
        active_peers=active,
        latency_ms=latency_ms,
        error=error_msg,
    )


def _health_score(rt: RuntimeState) -> tuple[str, float]:
    if not rt.ok:
        return "unhealthy", 0.0
    if rt.error:
        # Network errors exist
        return "unhealthy", 0.0
    # If no peers, treat as healthy (idle node).
    if not rt.peers:
        return "healthy", 1.0
    # Score by active handshake ratio, with a mild penalty for slow exec latency.
    ratio = float(rt.active_peers) / float(max(1, len(rt.peers)))
    latency_penalty = min(max((rt.latency_ms or 0) / 2000.0, 0.0), 0.25)  # 2s => 0.25
    score = max(0.0, min(1.0, ratio - latency_penalty + 0.25))
    if score >= 0.9:
        return "healthy", score
    # 0.45–0.5: treat as degraded so single node remains schedulable when many peers are idle
    if score >= 0.45:
        return "degraded", score
    return "unhealthy", score


def _http_session() -> requests.Session:
    s = requests.Session()
    s.headers.update(
        {
            "User-Agent": f"vpn-suite-node-agent/{os.getenv('AGENT_VERSION','0.1.0')}",
            "X-Agent-Token": os.getenv("AGENT_SHARED_TOKEN", ""),
        }
    )
    return s


def _request_kwargs() -> dict[str, Any]:
    # Optional mTLS
    cert = os.getenv("MTLS_CERT_FILE", "").strip()
    key = os.getenv("MTLS_KEY_FILE", "").strip()
    ca = os.getenv("MTLS_CA_FILE", "").strip()
    require_mtls = os.getenv("REQUIRE_MTLS", "1").strip().lower() in ("1", "true", "yes")
    verify: Any = True
    if ca:
        verify = ca
    if os.getenv("TLS_INSECURE_SKIP_VERIFY", "").strip().lower() in ("1", "true", "yes"):
        verify = False
    kwargs: dict[str, Any] = {"timeout": float(os.getenv("HTTP_TIMEOUT_SECONDS", "10")), "verify": verify}
    if require_mtls and (not cert or not key):
        raise RuntimeError("REQUIRE_MTLS=1 but MTLS_CERT_FILE/MTLS_KEY_FILE are not set")
    if cert and key:
        kwargs["cert"] = (cert, key)
    return kwargs


def _control_plane_url(path: str) -> str:
    base = (os.getenv("CONTROL_PLANE_URL", "") or "").strip()
    if not base:
        raise RuntimeError("CONTROL_PLANE_URL is required")
    require_mtls = os.getenv("REQUIRE_MTLS", "1").strip().lower() in ("1", "true", "yes")
    if require_mtls and not base.lower().startswith("https://"):
        raise RuntimeError("CONTROL_PLANE_URL must be https:// when REQUIRE_MTLS=1")
    if not base.endswith("/"):
        base += "/"
    return urljoin(base, path.lstrip("/"))


def _status_class(status_code: int | None) -> str:
    if status_code is None:
        return "error"
    if status_code < 300:
        return "2xx"
    if status_code < 400:
        return "3xx"
    if status_code < 500:
        return "4xx"
    return "5xx"


def _heartbeat(session: requests.Session, payload: dict[str, Any], correlation_id: str | None = None) -> None:
    endpoint = "/api/v1/agent/heartbeat"
    url = _control_plane_url(endpoint)
    headers = {"X-Request-ID": correlation_id} if correlation_id else {}
    start = time.perf_counter()
    status_code: int | None = None
    try:
        r = session.post(url, json=payload, headers=headers, **_request_kwargs())
        status_code = r.status_code
        if r.status_code >= 300:
            raise RuntimeError(f"heartbeat failed status={r.status_code} body={r.text[:200]}")
    finally:
        METRIC_HTTP_REQUESTS_TOTAL.labels(
            endpoint=endpoint, method="POST", status_class=_status_class(status_code)
        ).inc()
        METRIC_HTTP_REQUEST_LATENCY_SECONDS.labels(endpoint=endpoint, method="POST").observe(
            time.perf_counter() - start
        )


def _desired_state(session: requests.Session, server_id: str, correlation_id: str | None = None) -> dict[str, Any]:
    endpoint = "/api/v1/agent/desired-state"
    url = _control_plane_url(f"{endpoint}?server_id={server_id}")
    headers = {"X-Request-ID": correlation_id} if correlation_id else {}
    start = time.perf_counter()
    status_code: int | None = None
    try:
        r = session.get(url, headers=headers, **_request_kwargs())
        status_code = r.status_code
        if r.status_code >= 300:
            raise RuntimeError(f"desired-state failed status={r.status_code} body={r.text[:200]}")
        data = r.json()
    finally:
        METRIC_HTTP_REQUESTS_TOTAL.labels(
            endpoint=endpoint, method="GET", status_class=_status_class(status_code)
        ).inc()
        METRIC_HTTP_REQUEST_LATENCY_SECONDS.labels(endpoint=endpoint, method="GET").observe(
            time.perf_counter() - start
        )
    if not isinstance(data, dict):
        raise RuntimeError("desired-state invalid response")
    return data


def _actions_poll(session: requests.Session, server_id: str, correlation_id: str | None = None) -> dict[str, Any] | None:
    """GET agent/v1/actions/poll. Returns {action_id, type, payload} or None if no pending action."""
    endpoint = "/api/v1/agent/v1/actions/poll"
    url = _control_plane_url(f"{endpoint}?server_id={server_id}")
    headers = {"X-Request-ID": correlation_id} if correlation_id else {}
    start = time.perf_counter()
    status_code: int | None = None
    try:
        r = session.get(url, headers=headers, **_request_kwargs())
        status_code = r.status_code
        if r.status_code >= 300:
            return None
        data = r.json()
    finally:
        METRIC_HTTP_REQUESTS_TOTAL.labels(
            endpoint=endpoint, method="GET", status_class=_status_class(status_code)
        ).inc()
        METRIC_HTTP_REQUEST_LATENCY_SECONDS.labels(endpoint=endpoint, method="GET").observe(
            time.perf_counter() - start
        )
    if not isinstance(data, dict) or not data.get("action_id"):
        return None
    return data


def _actions_report(
    session: requests.Session,
    action_id: str,
    status: str,
    message: str = "",
    meta: dict[str, Any] | None = None,
    correlation_id: str | None = None,
) -> None:
    """POST agent/v1/actions/report (completed or failed)."""
    endpoint = "/api/v1/agent/v1/actions/report"
    url = _control_plane_url(endpoint)
    payload = {"action_id": action_id, "status": status, "message": message, "meta": meta or {}}
    headers = {"X-Request-ID": correlation_id} if correlation_id else {}
    start = time.perf_counter()
    status_code: int | None = None
    try:
        r = session.post(url, json=payload, headers=headers, **_request_kwargs())
        status_code = r.status_code
        if r.status_code >= 300:
            raise RuntimeError(f"actions/report failed status={r.status_code} body={r.text[:200]}")
    finally:
        METRIC_HTTP_REQUESTS_TOTAL.labels(
            endpoint=endpoint, method="POST", status_class=_status_class(status_code)
        ).inc()
        METRIC_HTTP_REQUEST_LATENCY_SECONDS.labels(endpoint=endpoint, method="POST").observe(
            time.perf_counter() - start
        )


def _apply_obfuscation_full_to_env(
    *,
    env_path: str,
    obf: dict[str, Any],
    container_id: str,
    docker_timeout: float,
    correlation_id: str | None = None,
) -> None:
    """If obf (s1,s2,jc,jmin,jmax,h1–h4) differs from env, update file and restart container."""
    want = {
        "AWG_S1": int(obf.get("s1", 213)),
        "AWG_S2": int(obf.get("s2", 237)),
        "AWG_Jc": int(obf.get("jc", 3)),
        "AWG_Jmin": int(obf.get("jmin", 10)),
        "AWG_Jmax": int(obf.get("jmax", 50)),
        "AWG_H1": int(obf.get("h1", 0)),
        "AWG_H2": int(obf.get("h2", 0)),
        "AWG_H3": int(obf.get("h3", 0)),
        "AWG_H4": int(obf.get("h4", 0)),
    }
    try:
        with open(env_path, "r") as f:
            lines = f.readlines()
    except OSError:
        return
    current: dict[str, int] = {}
    for line in lines:
        for key in want:
            if line.startswith(f"{key}="):
                try:
                    current[key] = int(line.split("=", 1)[1].strip().split("#")[0].strip())
                except (ValueError, IndexError):
                    pass
                break
    if current == want:
        return
    out, seen = [], set(want)
    for line in lines:
        updated = False
        for key in want:
            if line.startswith(f"{key}="):
                out.append(f"{key}={want[key]}\n")
                seen.discard(key)
                updated = True
                break
        if not updated:
            out.append(line)
    for key in seen:
        out.append(f"{key}={want[key]}\n")
    try:
        with open(env_path, "w") as f:
            f.writelines(out)
    except OSError:
        return
    code, out, _ = _run(
        ["docker", "restart", container_id],
        timeout=docker_timeout,
    )
    if code == 0:
        _log("obfuscation_full_synced", correlation_id=correlation_id, container=container_id)


def _reconcile(
    *,
    container: str,
    iface: str,
    desired: list[dict[str, Any]],
    runtime: list[Peer],
    docker_timeout: float,
    max_mutations: int,
    read_only: bool = True,
) -> tuple[int, int, int]:
    """Return (added, removed, updated)."""
    iface = _sanitize_iface(iface)
    container = _sanitize_container(container)

    desired_map: dict[str, dict[str, Any]] = {}
    for p in desired:
        pk = _sanitize_pubkey(str(p.get("public_key") or "").strip())
        raw_psk = p.get("preshared_key") or ""
        psk = (raw_psk.strip() or None) if isinstance(raw_psk, str) else None
        desired_map[pk] = {
            "allowed_ips": str(p.get("allowed_ips") or "0.0.0.0/0, ::/0").strip(),
            "keepalive": int(p.get("persistent_keepalive") or 25),
            "preshared_key": psk,
        }

    runtime_map: dict[str, Peer] = {p.public_key: p for p in runtime if p.public_key}

    to_add = [pk for pk in desired_map.keys() if pk not in runtime_map]
    to_remove = [pk for pk in runtime_map.keys() if pk not in desired_map]
    to_update = []
    for pk, spec in desired_map.items():
        rp = runtime_map.get(pk)
        if not rp:
            continue
        allowed_changed = spec["allowed_ips"] and (spec["allowed_ips"] != (rp.allowed_ips or "").strip())
        has_psk = bool(spec.get("preshared_key"))
        if allowed_changed or has_psk:
            to_update.append(pk)

    METRIC_ORPHAN_PEERS.set(len(to_remove))
    METRIC_DRIFT_PEERS.set(len(to_update))

    allow_prune_empty = os.getenv("ALLOW_PRUNE_EMPTY_DESIRED", "").strip().lower() in (
        "1",
        "true",
        "yes",
    )
    if not desired_map and runtime_map and not allow_prune_empty:
        METRIC_PEER_PRUNE_BLOCKED.labels(reason="empty_desired").inc(len(runtime_map))
        _log(
            "prune_blocked_empty_desired",
            container=container,
            iface=iface,
            runtime=len(runtime_map),
        )
        return 0, 0, 0

    if read_only:
        if to_add or to_remove or to_update:
            _log(
                "reconcile_read_only",
                container=container,
                to_add=len(to_add),
                orphan=len(to_remove),
                drift=len(to_update),
            )
        return 0, 0, 0

    added = removed = updated = 0
    mutations_left = max(0, int(max_mutations))

    def _run_set_peer(spec: dict[str, Any]) -> tuple[int, float]:
        """Run wg/awg set peer; return (exit_code, latency_ms). Uses preshared_key via stdin when present."""
        psk = spec.get("preshared_key")
        if psk:
            key_escaped = str(psk).replace("'", "'\"'\"'")
            script = (
                f"printf '%s\\n' '{key_escaped}' | wg set {iface} peer {pk} "
                f"allowed-ips {spec['allowed_ips']} persistent-keepalive {spec['keepalive']} preshared-key /dev/stdin"
            )
            code, _, latency_ms = _run(
                ["docker", "exec", container, "sh", "-c", script],
                timeout=docker_timeout,
            )
            return code, latency_ms
        code, _, latency_ms = _run(
            [
                "docker",
                "exec",
                container,
                "awg",
                "set",
                iface,
                "peer",
                pk,
                "allowed-ips",
                spec["allowed_ips"],
                "persistent-keepalive",
                str(spec["keepalive"]),
            ],
            timeout=docker_timeout,
        )
        return code, latency_ms

    # Adds
    for pk in to_add:
        if mutations_left <= 0:
            break
        spec = desired_map[pk]
        code, latency_ms = _run_set_peer(spec)
        METRIC_DOCKER_EXEC_LATENCY.labels(op="awg_set_add").observe(latency_ms / 1000.0)
        if code != 0:
            METRIC_RECONCILE_ERRORS.labels(stage="add_peer").inc()
            continue
        added += 1
        mutations_left -= 1

    # Updates (allowed-ips and/or preshared_key changes)
    for pk in to_update:
        if mutations_left <= 0:
            break
        spec = desired_map[pk]
        code, latency_ms = _run_set_peer(spec)
        METRIC_DOCKER_EXEC_LATENCY.labels(op="awg_set_update").observe(latency_ms / 1000.0)
        if code != 0:
            METRIC_RECONCILE_ERRORS.labels(stage="update_peer").inc()
            continue
        updated += 1
        mutations_left -= 1

    # Removes
    for pk in to_remove:
        if mutations_left <= 0:
            break
        pk = _sanitize_pubkey(pk)
        code, out, latency_ms = _run(
            ["docker", "exec", container, "awg", "set", iface, "peer", pk, "remove"],
            timeout=docker_timeout,
        )
        METRIC_DOCKER_EXEC_LATENCY.labels(op="awg_set_remove").observe(latency_ms / 1000.0)
        if code != 0:
            METRIC_RECONCILE_ERRORS.labels(stage="remove_peer").inc()
            continue
        removed += 1
        mutations_left -= 1

    if added or removed or updated:
        try:
            _run(["docker", "exec", container, "awg-quick", "save", iface], timeout=docker_timeout)
        except Exception as e:
            _log("reconcile_save_error", container=container, error=str(e))

    if added:
        METRIC_PEER_MUTATIONS.labels(type="add").inc(added)
    if removed:
        METRIC_PEER_MUTATIONS.labels(type="remove").inc(removed)
    if updated:
        METRIC_PEER_MUTATIONS.labels(type="update").inc(updated)

    return added, removed, updated


class Handler(BaseHTTPRequestHandler):
    def do_GET(self) -> None:  # noqa: N802
        if self.path == "/metrics":
            data = generate_latest()
            self.send_response(200)
            self.send_header("Content-Type", CONTENT_TYPE_LATEST)
            self.send_header("Content-Length", str(len(data)))
            self.end_headers()
            self.wfile.write(data)
            return
        if self.path == "/healthz":
            # OK if we had a recent successful cycle.
            now = time.time()
            interval = float(os.getenv("HEARTBEAT_INTERVAL_SECONDS", "15"))
            with STATE.lock:
                ok_age = now - STATE.last_ok_time if STATE.last_ok_time else 1e9
                last_err = STATE.last_err
                last_container = STATE.last_container
            healthy = ok_age <= max(60.0, interval * 4.0)
            payload = {
                "status": "ok" if healthy else "degraded",
                "ok_age_seconds": round(ok_age, 1),
                "container": last_container,
                "error": last_err,
            }
            body = (json.dumps(payload) + "\n").encode("utf-8")
            self.send_response(200 if healthy else 503)
            self.send_header("Content-Type", "application/json")
            self.send_header("Content-Length", str(len(body)))
            self.end_headers()
            self.wfile.write(body)
            return
        self.send_response(404)
        self.end_headers()

    def log_message(self, fmt: str, *args: Any) -> None:
        # Keep logs minimal; production logging should go to stdout collector.
        return


def _serve_http(port: int) -> None:
    httpd = HTTPServer(("0.0.0.0", port), Handler)
    httpd.serve_forever()


def main() -> int:
    server_id = (os.getenv("SERVER_ID", "") or "").strip()
    if not server_id:
        raise RuntimeError("SERVER_ID is required")
    if not os.getenv("AGENT_SHARED_TOKEN", "").strip():
        raise RuntimeError("AGENT_SHARED_TOKEN is required (or disable agent endpoints server-side)")

    discovery_mode = (os.getenv("NODE_DISCOVERY", "") or "").strip().lower()
    node_mode = (os.getenv("NODE_MODE", "") or "").strip().lower()
    if discovery_mode and discovery_mode != "agent":
        _log(
            "startup_conflict",
            discovery_mode=discovery_mode,
            node_mode=node_mode or None,
        )
        raise RuntimeError(
            f"Refusing to start node-agent: NODE_DISCOVERY must be 'agent' when node-agent runs, got {discovery_mode!r}."
        )
    if node_mode and node_mode not in ("agent", "mock"):
        _log(
            "startup_conflict",
            discovery_mode=discovery_mode or None,
            node_mode=node_mode,
        )
        raise RuntimeError(
            f"Refusing to start node-agent: NODE_MODE must be 'agent' (or 'mock' in tests), got {node_mode!r}."
        )

    container_filter = os.getenv("CONTAINER_FILTER", "auto").strip()
    explicit_container = os.getenv("CONTAINER_NAME", "").strip() or None
    iface = os.getenv("INTERFACE_NAME", "awg0").strip()
    active_age_sec = _env_int("ACTIVE_PEER_AGE_SECONDS", 180)
    hb_interval = float(os.getenv("HEARTBEAT_INTERVAL_SECONDS", "15"))
    desired_interval = float(os.getenv("DESIRED_STATE_INTERVAL_SECONDS", "15"))
    reconcile_interval = float(os.getenv("RECONCILE_INTERVAL_SECONDS", "30"))
    docker_timeout = float(os.getenv("DOCKER_EXEC_TIMEOUT_SECONDS", "10"))
    max_mutations = _env_int("MAX_MUTATIONS_PER_CYCLE", 200)
    read_only_mode = _env_int("RECONCILE_READ_ONLY", 1) == 1
    http_port = _env_int("HTTP_PORT", 9105)

    # HTTP server (metrics + healthz)
    t = threading.Thread(target=_serve_http, args=(http_port,), daemon=True)
    t.start()

    # RTT worker: per-peer ping from node (optional)
    rtt_enabled = (os.getenv("RTT_ENABLED", "1") or "").strip().lower() in ("1", "true", "yes")
    rtt_scan_interval = float(os.getenv("RTT_SCAN_INTERVAL_SECONDS", "10"))
    rtt_max_concurrent = max(1, min(50, _env_int("RTT_MAX_CONCURRENT", 50)))
    rtt_ping_timeout = max(1, min(5, _env_int("RTT_PING_TIMEOUT_SECONDS", 1)))
    if rtt_enabled:
        rtt_thread = threading.Thread(
            target=_rtt_worker_loop,
            args=(
                container_filter,
                explicit_container,
                iface,
                docker_timeout,
                rtt_scan_interval,
                rtt_max_concurrent,
                float(rtt_ping_timeout),
            ),
            daemon=True,
        )
        rtt_thread.start()

    stop = threading.Event()

    def _sig(_signo: int, _frame: Any) -> None:
        stop.set()

    signal.signal(signal.SIGINT, _sig)
    signal.signal(signal.SIGTERM, _sig)

    session = _http_session()

    last_hb = 0.0
    last_desired = 0.0
    last_reconcile = 0.0
    last_actions_poll = 0.0
    actions_poll_interval = float(os.getenv("ACTIONS_POLL_INTERVAL_SECONDS", "10"))
    desired_peers: list[dict[str, Any]] = []

    while not stop.is_set():
        cid = str(uuid.uuid4())
        now = time.time()
        try:
            containers = _pick_containers(container_filter, explicit_container, timeout=docker_timeout)
            if not containers:
                with STATE.lock:
                    STATE.last_err = "no matching container"
                    STATE.last_container = ""
                METRIC_HEARTBEAT_OK.set(0)
                _log("no_container", correlation_id=cid, container_filter=container_filter)
                if now - last_hb >= hb_interval:
                    try:
                        hb = {
                            "server_id": server_id,
                            "container_name": "(no container)",
                            "container_id": "",
                            "host_id": _host_id(),
                            "classification": {"type": "unknown"},
                            "confidence": 0.0,
                            "evidence": ["no_container"],
                            "interface_name": iface,
                            "public_key": "",
                            "listen_port": 0,
                            "peer_count": 0,
                            "total_rx_bytes": 0,
                            "total_tx_bytes": 0,
                            "health_score": 0.0,
                            "status": "unknown",
                            "agent_version": os.getenv("AGENT_VERSION", "0.1.0"),
                            "ts_utc": _iso_utc(_now_utc()),
                        }
                        _heartbeat(session, hb, cid)
                        last_hb = now
                        with STATE.lock:
                            STATE.last_ok_time = time.time()
                            STATE.last_err = None
                        METRIC_HEARTBEAT_OK.set(1)
                    except Exception:
                        pass
                time.sleep(2.0)
                continue

            # Primary container for desired-state/reconcile (first or the one matching SERVER_ID)
            primary_container: ContainerCandidate | None = None
            for c in containers:
                if _server_id_from_container(c.name) == server_id or c.name == server_id:
                    primary_container = c
                    break
            if not primary_container:
                primary_container = containers[0]

            # Heartbeat for every discovered container so admin shows all
            if now - last_hb >= hb_interval:
                for container in containers:
                    sid = _server_id_from_container(container.name)
                    try:
                        rt = _runtime_state(
                            container=container.container_id,
                            display_name=container.name,
                            iface=iface,
                            docker_timeout=docker_timeout,
                            active_age_sec=active_age_sec,
                        )
                        now_ts = int(_now_utc().timestamp())
                        for p in rt.peers:
                            if p.last_handshake_ts > 0:
                                age_sec = max(0, now_ts - p.last_handshake_ts)
                                METRIC_HANDSHAKE_AGE.observe(age_sec)
                            if p.endpoint:
                                with STATE.lock:
                                    prev = STATE.last_peer_endpoints.get(p.public_key)
                                    if prev and prev != p.endpoint:
                                        METRIC_PEER_ENDPOINT_CHANGES.inc()
                                        METRIC_PEER_ROAMING.inc()
                                    STATE.last_peer_endpoints[p.public_key] = p.endpoint
                        status, score = _health_score(rt)
                        peers_payload = []
                        for p in rt.peers:
                            age_sec = (now_ts - p.last_handshake_ts) if p.last_handshake_ts else None
                            entry: dict[str, Any] = {
                                "public_key": p.public_key,
                                "allowed_ips": p.allowed_ips or "",
                                "last_handshake_age_sec": age_sec,
                                "rx_bytes": p.rx,
                                "tx_bytes": p.tx,
                                "endpoint": p.endpoint or "",
                            }
                            rtt = _get_peer_rtt_ms(container.container_id, p.public_key)
                            if rtt is not None:
                                entry["rtt_ms"] = rtt
                            peers_payload.append(entry)
                        obf = _get_obfuscation_from_container(
                            container.container_id, iface, docker_timeout
                        )
                        hb = {
                            "server_id": sid,
                            "container_name": rt.container_name,
                            "container_id": container.container_id,
                            "host_id": _host_id(),
                            "classification": {"type": "awg-node"},
                            "confidence": container.confidence,
                            "evidence": container.evidence,
                            "interface_name": rt.interface_name,
                            "public_key": rt.public_key,
                            "listen_port": int(rt.listen_port or 0),
                            "peer_count": int(len(rt.peers)),
                            "total_rx_bytes": int(rt.total_rx),
                            "total_tx_bytes": int(rt.total_tx),
                            "health_score": float(score),
                            "status": status,
                            "agent_version": os.getenv("AGENT_VERSION", "0.1.0"),
                            "ts_utc": _iso_utc(_now_utc()),
                            "peers": peers_payload,
                        }
                        if obf:
                            hb["obfuscation"] = obf
                        _heartbeat(session, hb, cid)
                    except Exception as e:
                        # Still register server so it appears in admin (e.g. wrong iface or awg missing)
                        try:
                            _heartbeat(session, {
                                "server_id": sid,
                                "container_name": container.name,
                                "container_id": container.container_id,
                                "host_id": _host_id(),
                                "classification": {"type": "awg-node"},
                                "confidence": container.confidence,
                                "evidence": container.evidence,
                                "interface_name": iface,
                                "public_key": "",
                                "listen_port": 0,
                                "peer_count": 0,
                                "total_rx_bytes": 0,
                                "total_tx_bytes": 0,
                                "health_score": 0.0,
                                "status": "unknown",
                                "agent_version": os.getenv("AGENT_VERSION", "0.1.0"),
                                "ts_utc": _iso_utc(_now_utc()),
                            }, cid)
                        except Exception:
                            pass
                        _log("heartbeat_fail", correlation_id=cid, container=container.name, error=str(e)[:200])
                last_hb = now
                METRIC_HEARTBEAT_OK.set(1)
                _log("heartbeat", correlation_id=cid, containers=len(containers))

            # Desired state + reconcile only for primary container
            rt = _runtime_state(
                container=primary_container.container_id,
                display_name=primary_container.name,
                iface=iface,
                docker_timeout=docker_timeout,
                active_age_sec=active_age_sec,
            )
            status, score = _health_score(rt)
            METRIC_PEERS_RUNTIME.set(len(rt.peers))
            METRIC_PEERS_ACTIVE.set(rt.active_peers)
            if rt.last_handshake_max_age_sec is not None:
                METRIC_HANDSHAKE_MAX_AGE.set(rt.last_handshake_max_age_sec)

            primary_sid = _server_id_from_container(primary_container.name)
            desired_state_sid = server_id if server_id else primary_sid
            if now - last_desired >= desired_interval:
                ds = _desired_state(session, desired_state_sid, cid)
                peers = ds.get("peers") or []
                if not isinstance(peers, list):
                    peers = []
                desired_peers = [p for p in peers if isinstance(p, dict)]
                METRIC_PEERS_DESIRED.set(len(desired_peers))
                last_desired = now
                _log("desired_state", correlation_id=cid, peers=len(desired_peers), revision=ds.get("revision"))
                # Sync obfuscation_full from admin (S1,S2,Jc,Jmin,Jmax,H1–H4) to node env so issued configs match
                obf_full = ds.get("obfuscation_full") if isinstance(ds.get("obfuscation_full"), dict) else None
                env_path = os.environ.get("AMNEZIA_NODE_ENV_PATH", "").strip()
                if obf_full and env_path and rt.ok:
                    _apply_obfuscation_full_to_env(
                        env_path=env_path,
                        obf=obf_full,
                        container_id=primary_container.container_id,
                        docker_timeout=docker_timeout,
                        correlation_id=cid,
                    )

            if rt.ok and (last_reconcile == 0.0 or now - last_reconcile >= reconcile_interval):
                with METRIC_RECONCILE_DURATION.time():
                    added, removed, updated = _reconcile(
                        container=primary_container.container_id,
                        iface=iface,
                        desired=desired_peers,
                        runtime=rt.peers,
                        docker_timeout=docker_timeout,
                        max_mutations=max_mutations,
                        read_only=read_only_mode,
                    )
                last_reconcile = now
                if added or removed or updated:
                    _log("reconcile", correlation_id=cid, added=added, removed=removed, updated=updated)

            if now - last_actions_poll >= actions_poll_interval and rt.ok:
                last_actions_poll = now
                act = _actions_poll(session, desired_state_sid, cid)
                if act and act.get("action_id"):
                    action_id = act["action_id"]
                    act_type = act.get("type") or ""
                    try:
                        if act_type in ("sync", "apply_peers"):
                            ds = _desired_state(session, desired_state_sid, cid)
                            peers = ds.get("peers") or []
                            desired_for_action = [p for p in peers if isinstance(p, dict)]
                            with METRIC_RECONCILE_DURATION.time():
                                _reconcile(
                                    container=primary_container.container_id,
                                    iface=iface,
                                    desired=desired_for_action,
                                    runtime=rt.peers,
                                    docker_timeout=docker_timeout,
                                    max_mutations=max_mutations,
                                    read_only=read_only_mode,
                                )
                            desired_peers = desired_for_action
                            _actions_report(session, action_id, "completed", "ok", correlation_id=cid)
                            _log("action_completed", correlation_id=cid, action_id=action_id, type=act_type)
                        elif act_type in ("drain", "undrain"):
                            # Backend already set is_draining; agent just acknowledges.
                            _actions_report(session, action_id, "completed", "ok", correlation_id=cid)
                            _log("action_completed", correlation_id=cid, action_id=action_id, type=act_type)
                        elif act_type == "restart_service":
                            code, out, _ = _run(
                                ["docker", "restart", primary_container.container_id],
                                timeout=docker_timeout,
                            )
                            if code != 0:
                                raise RuntimeError(f"docker restart exited {code}: {out[:200]}")
                            _actions_report(session, action_id, "completed", "container restarted", correlation_id=cid)
                            _log("action_completed", correlation_id=cid, action_id=action_id, type=act_type)
                        elif act_type == "apply_profile":
                            # Stub: payload could contain AWG params; for now acknowledge.
                            _actions_report(session, action_id, "completed", "ok", correlation_id=cid)
                            _log("action_completed", correlation_id=cid, action_id=action_id, type=act_type)
                        elif act_type == "apply_obfuscation_h":
                            payload = act.get("payload") or {}
                            h1, h2, h3, h4 = payload.get("h1"), payload.get("h2"), payload.get("h3"), payload.get("h4")
                            env_path = os.environ.get("AMNEZIA_NODE_ENV_PATH", "").strip()
                            if not all(isinstance(x, int) for x in (h1, h2, h3, h4)):
                                _actions_report(session, action_id, "failed", "payload missing h1,h2,h3,h4", correlation_id=cid)
                            elif not env_path:
                                _actions_report(session, action_id, "failed", "AMNEZIA_NODE_ENV_PATH not set", correlation_id=cid)
                            else:
                                try:
                                    with open(env_path, "r") as f:
                                        lines = f.readlines()
                                    out, seen = [], {"AWG_H1", "AWG_H2", "AWG_H3", "AWG_H4"}
                                    for line in lines:
                                        if line.startswith("AWG_H1="): out.append(f"AWG_H1={h1}\n"); seen.discard("AWG_H1")
                                        elif line.startswith("AWG_H2="): out.append(f"AWG_H2={h2}\n"); seen.discard("AWG_H2")
                                        elif line.startswith("AWG_H3="): out.append(f"AWG_H3={h3}\n"); seen.discard("AWG_H3")
                                        elif line.startswith("AWG_H4="): out.append(f"AWG_H4={h4}\n"); seen.discard("AWG_H4")
                                        else: out.append(line)
                                    for k in ("AWG_H1", "AWG_H2", "AWG_H3", "AWG_H4"):
                                        if k in seen:
                                            out.append(f"{k}={payload[k.replace('AWG_', '').lower()]}\n")
                                    with open(env_path, "w") as f:
                                        f.writelines(out)
                                    code, out, _ = _run(
                                        ["docker", "restart", primary_container.container_id],
                                        timeout=docker_timeout,
                                    )
                                    if code != 0:
                                        raise RuntimeError(f"docker restart exited {code}: {out[:200]}")
                                    _actions_report(session, action_id, "completed", "obfuscation_h applied, container restarted", correlation_id=cid)
                                except Exception as e:
                                    _actions_report(session, action_id, "failed", str(e)[:300], correlation_id=cid)
                            _log("action_completed" if env_path else "action_failed", correlation_id=cid, action_id=action_id, type=act_type)
                        else:
                            _actions_report(session, action_id, "completed", "no-op", correlation_id=cid)
                            _log("action_completed", correlation_id=cid, action_id=action_id, type=act_type)
                    except Exception as action_exc:
                        err_msg = str(action_exc)[:500]
                        try:
                            _actions_report(session, action_id, "failed", err_msg, correlation_id=cid)
                        except Exception:
                            pass
                        _log("action_failed", correlation_id=cid, action_id=action_id, error=err_msg)

            with STATE.lock:
                STATE.last_ok_time = time.time()
                STATE.last_err = None
                STATE.last_container = primary_container.name
                STATE.last_runtime_peers = len(rt.peers)
                STATE.last_desired_peers = len(desired_peers)
            METRIC_LAST_SUCCESS_TS.set(time.time())

        except Exception as exc:
            METRIC_HEARTBEAT_OK.set(0)
            with STATE.lock:
                STATE.last_err = str(exc)[:200]
            _log("error", correlation_id=cid, error=str(exc)[:200])
            time.sleep(2.0)

        time.sleep(0.2)

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
