"""Docker runtime adapter for AmneziaWG nodes (discover + wg control via docker exec)."""

from __future__ import annotations

import asyncio
import hashlib
import ipaddress
import json
import logging
import re
import time
from datetime import datetime, timezone
from pathlib import Path
from typing import TYPE_CHECKING
from uuid import uuid4

from app.core.exceptions import NodeDiscoveryError, WireGuardCommandError

if TYPE_CHECKING:
    import docker
from app.schemas.node import NodeMetadata
from app.services.node_runtime import NodeRuntimeAdapter, PeerConfigLike

_log = logging.getLogger(__name__)

_PUBLIC_KEY_PATTERN = re.compile(r"^[A-Za-z0-9+/=]{32,64}$")
_ALLOWED_IPS_PATTERN = re.compile(r"^[0-9A-Fa-f.,/: \t]+$")
_CONTAINER_NAME_PATTERN = re.compile(r"^[a-zA-Z0-9][a-zA-Z0-9_.-]{0,127}$")
_INTERFACE_NAME_PATTERN = re.compile(r"^[a-zA-Z0-9_.:-]{1,32}$")
# Reply traffic to client IPs must go via WG iface; we ensure one route per subnet (e.g. /24)
_CLIENT_SUBNET_PREFIXLEN = 24
_AMNEZIA_IMAGE_PATTERNS = [
    r"amnezia[wgvpn/\\-]*",
    r"amneziawg",
    r"metaligh/amneziawg",
    r"amneziavpn/amneziawg",
]


def _ensure_host_id(path: str = "/etc/vpn-suite/node-id") -> str:
    p = Path(path)
    try:
        if p.exists():
            v = p.read_text(encoding="utf-8").strip()
            if v:
                return v
    except Exception:
        pass
    try:
        p.parent.mkdir(parents=True, exist_ok=True)
        v = str(uuid4())
        p.write_text(v + "\n", encoding="utf-8")
        return v
    except Exception:
        return "local"


def _match_any(s: str, patterns: list[str]) -> bool:
    if not s:
        return False
    return any(re.search(p, s, re.I) for p in patterns)


def _sanitize_container_name(container_name: str) -> str:
    name = container_name.strip()
    if not _CONTAINER_NAME_PATTERN.fullmatch(name):
        raise WireGuardCommandError(
            "Invalid container name", command="docker exec", output=name[:32]
        )
    return name


def _sanitize_public_key(public_key: str) -> str:
    key = public_key.strip()
    if not _PUBLIC_KEY_PATTERN.fullmatch(key):
        raise WireGuardCommandError("Invalid public key", command="wg set peer", output=key[:16])
    return key


def _sanitize_allowed_ips(allowed_ips: str) -> str:
    value = allowed_ips.strip()
    if not value or not _ALLOWED_IPS_PATTERN.fullmatch(value):
        raise WireGuardCommandError(
            "Invalid allowed IPs", command="wg set allowed-ips", output=value[:32]
        )
    return value


def _sanitize_interface_name(interface_name: str) -> str:
    iface = interface_name.strip()
    if not _INTERFACE_NAME_PATTERN.fullmatch(iface):
        raise WireGuardCommandError("Invalid interface name", command="wg show", output=iface[:32])
    return iface


def _clamp_keepalive(value: int | None) -> int:
    if value is None:
        return 25
    return min(max(int(value), 0), 65535)


def _parse_docker_mem_bytes(s: str) -> int | None:
    """Parse docker stats MemUsage part e.g. '52MiB', '1.952GiB' to bytes."""
    if not s:
        return None
    s = s.strip().upper().replace(" ", "")
    mult = 1
    if s.endswith("KIB"):
        mult = 1024
        s = s[:-3]
    elif s.endswith("KB"):
        mult = 1000
        s = s[:-2]
    elif s.endswith("MIB"):
        mult = 1024 * 1024
        s = s[:-3]
    elif s.endswith("MB"):
        mult = 1000 * 1000
        s = s[:-2]
    elif s.endswith("GIB"):
        mult = 1024 * 1024 * 1024
        s = s[:-3]
    elif s.endswith("GB"):
        mult = 1000 * 1000 * 1000
        s = s[:-2]
    elif s.endswith("B"):
        s = s[:-1]
    try:
        return int(float(s) * mult)
    except ValueError:
        return None


def _get_docker_client() -> docker.DockerClient:
    import docker

    return docker.from_env()


def _docker_exec_sync(
    container_name: str, cmd: list[str], *, stdin: bytes | None = None
) -> tuple[int, str]:
    """Run command in container via Docker SDK. Sync, run in thread from async."""
    import docker

    client = docker.from_env()
    try:
        container = client.containers.get(container_name)
        result = container.exec_run(cmd)
        exit_code = result.exit_code if result.exit_code is not None else -1
        output = (result.output or b"").decode("utf-8", errors="replace")
        return (exit_code, output)
    except Exception as e:
        return (-1, str(e))


def _docker_ps_sync(fmt: str | None) -> tuple[int, str]:
    import docker

    client = docker.from_env()
    names: list[str] = []
    ids: list[str] = []
    for c in client.containers.list():
        name = (c.name or "").lstrip("/")
        if name:
            names.append(name)
        if getattr(c, "id", None):
            ids.append(str(c.id))
    if fmt == "{{.ID}}":
        return (0, "\n".join(ids))
    return (0, "\n".join(names))


async def _run_command(
    cmd: list[str], *, timeout: float = 30.0, stdin: bytes | None = None
) -> tuple[int, str]:
    """Legacy-compatible command runner used by tests (docker exec/ps only)."""
    if not cmd:
        return (1, "empty command")
    if cmd[:2] == ["docker", "exec"] and len(cmd) >= 4:
        container = cmd[2]
        inner = cmd[3:]
        return await asyncio.to_thread(_docker_exec_sync, container, inner, stdin=stdin)
    if cmd[:2] == ["docker", "ps"]:
        fmt = None
        if "--format" in cmd:
            try:
                fmt = cmd[cmd.index("--format") + 1]
            except Exception:
                fmt = None
        return await asyncio.to_thread(_docker_ps_sync, fmt)
    return (1, "unsupported command")


async def _docker_exec(
    container_name: str, cmd: list[str], *, timeout: float = 30.0, stdin: bytes | None = None
) -> tuple[int, str]:
    """Run command in container via Docker SDK (no CLI required)."""
    return await _run_command(
        ["docker", "exec", container_name, *cmd], timeout=timeout, stdin=stdin
    )


async def _ensure_client_subnet_routes(
    container_name: str, interface: str, subnet_cidrs: list[str]
) -> None:
    """Ensure routes for client subnets via WG iface so reply traffic reaches all peers."""
    for cidr in subnet_cidrs:
        if not cidr:
            continue
        code, out = await _docker_exec(
            container_name,
            ["ip", "route", "add", cidr, "dev", interface],
            timeout=10.0,
        )
        if code == 0 or "File exists" in out or "already exists" in out.lower():
            continue
        _log.warning(
            "ip route add %s dev %s failed in %s: code=%s %s",
            cidr,
            interface,
            container_name,
            code,
            out[:120],
        )


async def _persist_wg_config(container_name: str, interface: str) -> None:
    """Save current runtime configuration to the persistent file inside container."""
    # We use /run/{interface}.conf as the standard persistence path for this environment.
    # Note: AmneziaWG containers often expect this path for survival across restarts.
    conf_path = f"/run/{interface}.conf"
    script = f"wg showconf {interface} > {conf_path}"
    code, output = await _docker_exec(container_name, ["sh", "-c", script], timeout=10.0)
    if code != 0:
        _log.warning(
            "Failed to persist wg config to %s in %s: %s",
            conf_path,
            container_name,
            output[:100],
        )
    else:
        _log.debug("Persisted wg config to %s in %s", conf_path, container_name)


def _node_id(container_name: str) -> str:
    """Stable node identifier derived only from container name."""
    return hashlib.sha256(container_name.encode("utf-8")).hexdigest()[:32]


def node_id_from_docker_api_endpoint(api_endpoint: str) -> str | None:
    """Resolve node_id from docker://container_name. Returns None if not docker or invalid."""
    if not api_endpoint or not isinstance(api_endpoint, str):
        return None
    s = api_endpoint.strip()
    if not s.startswith("docker://"):
        return None
    name = s[9:].strip()
    if not name:
        return None
    try:
        safe = _sanitize_container_name(name)
        if re.fullmatch(r"[a-f0-9]{12,64}", safe):
            return f"docker:{safe[:12]}"
        return _node_id(safe)
    except WireGuardCommandError:
        return None


def _node_status(health_score: float) -> str:
    if health_score >= 0.9:
        return "healthy"
    if health_score >= 0.5:
        return "degraded"
    return "unhealthy"


def _parse_wg_dump(output: str) -> tuple[str, int, list[dict]]:
    """Parse `wg show <iface> dump` output."""
    lines = [line for line in output.strip().splitlines() if line.strip()]
    if not lines:
        return ("", 0, [])
    interface_parts = lines[0].split("\t")
    # `wg show all dump` interface line:
    #   interface private_key public_key listen_port fwmark
    # `wg show <iface> dump` interface line:
    #   private_key public_key listen_port fwmark
    if len(interface_parts) >= 5 and not _PUBLIC_KEY_PATTERN.fullmatch(interface_parts[0] or ""):
        interface_pubkey = interface_parts[2]
        port_raw = interface_parts[3]
    else:
        interface_pubkey = interface_parts[1] if len(interface_parts) > 1 else ""
        port_raw = interface_parts[2] if len(interface_parts) > 2 else "0"
    try:
        listen_port = int(port_raw) if port_raw else 0
    except ValueError:
        listen_port = 0

    peers: list[dict] = []
    for line in lines[1:]:
        parts = line.split("\t")
        if len(parts) < 8:
            continue
        try:
            last_handshake = int(parts[4]) if parts[4] else 0
        except ValueError:
            last_handshake = 0
        try:
            transfer_rx = int(parts[5]) if parts[5] else 0
        except ValueError:
            transfer_rx = 0
        try:
            transfer_tx = int(parts[6]) if parts[6] else 0
        except ValueError:
            transfer_tx = 0
        peers.append(
            {
                "public_key": parts[0],
                "allowed_ips": parts[3] if len(parts) > 3 else "",
                "last_handshake": last_handshake,
                "transfer_rx": transfer_rx,
                "transfer_tx": transfer_tx,
            }
        )
    return (interface_pubkey, listen_port, peers)


def _parse_wg_show_obfuscation(output: str) -> dict | None:
    """Parse `wg show <iface>` human output for AmneziaWG obfuscation params."""
    result: dict = {}
    for line in output.strip().splitlines():
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
                result[
                    "S1" if key == "s1" else "S2" if key == "s2" else "S3" if key == "s3" else "S4"
                ] = int(val)
            except ValueError:
                pass
        elif key in ("h1", "h2", "h3", "h4") and val:
            # H1-H4 may be numeric or range string (e.g. "0-255"); pass through when parseable.
            v = val.strip()
            if v.isdigit():
                result[
                    "H1" if key == "h1" else "H2" if key == "h2" else "H3" if key == "h3" else "H4"
                ] = int(v)
            elif "-" in v:
                left, _, right = v.partition("-")
                if left.strip().isdigit() and right.strip().isdigit():
                    result[
                        "H1"
                        if key == "h1"
                        else "H2"
                        if key == "h2"
                        else "H3"
                        if key == "h3"
                        else "H4"
                    ] = f"{left.strip()}-{right.strip()}"
    return result if result else None


def _extract_ports(inspect: dict) -> set[tuple[str, int]]:
    ports: set[tuple[str, int]] = set()
    ports_raw = (inspect.get("NetworkSettings") or {}).get("Ports") or {}
    exp = (inspect.get("Config") or {}).get("ExposedPorts") or {}
    for raw in list(exp) + list(ports_raw):
        if "/" in str(raw):
            ps, proto = str(raw).rsplit("/", 1)
            if ps.isdigit():
                ports.add((proto.lower(), int(ps)))
    return ports


def _extract_mounts(inspect: dict) -> list[str]:
    mounts = inspect.get("Mounts") or []
    return [
        str(m["Destination"])
        for m in mounts
        if isinstance(m, dict) and m.get("Destination") is not None
    ]


def _extract_env(inspect: dict) -> dict[str, str]:
    out: dict[str, str] = {}
    for e in (inspect.get("Config") or {}).get("Env") or []:
        if isinstance(e, str) and "=" in e:
            k, _, v = e.partition("=")
            out[k.strip()] = v.strip()
    return out


def _extract_labels(inspect: dict) -> dict[str, str]:
    return dict((inspect.get("Config") or {}).get("Labels") or {})


def _extract_entrypoint_cmd(inspect: dict) -> str:
    cfg = inspect.get("Config") or {}
    ep = cfg.get("Entrypoint") or []
    cmd = cfg.get("Cmd") or []
    a = list(ep) if isinstance(ep, list | tuple) else [ep]
    b = list(cmd) if isinstance(cmd, list | tuple) else [cmd]
    return " ".join(str(x) for x in a + b).lower()


def _classify_container_inspect(inspect: dict, image_refs: list[str]) -> dict:
    ports = _extract_ports(inspect)
    mounts = _extract_mounts(inspect)
    _extract_env(inspect)  # reserved for future classification
    _extract_labels(inspect)  # reserved for future classification
    entry = _extract_entrypoint_cmd(inspect)
    caps = (inspect.get("HostConfig") or {}).get("CapAdd") or []

    evidence: list[str] = []
    conf = 0.0
    kind = "unknown"
    ctype = "unknown"

    if any(_match_any(r, _AMNEZIA_IMAGE_PATTERNS) for r in image_refs if r):
        conf = max(conf, 0.9)
        evidence.append("image_amnezia")
        kind = "awg"
        ctype = "awg-node"
    if "amneziawg" in entry or "wg " in entry or "awg" in entry:
        conf = max(conf, 0.7)
        evidence.append("entrypoint_awg")
        kind = "awg"
        ctype = "awg-node"
    if any(m and "/dev/net/tun" in m for m in mounts):
        conf = max(conf, 0.6)
        evidence.append("mount_tun")
        if kind == "unknown":
            kind = "awg"
            ctype = "awg-node"
    if "NET_ADMIN" in caps or "CAP_NET_ADMIN" in caps:
        conf = max(conf, 0.5)
        evidence.append("cap_net_admin")
        if kind == "unknown":
            kind = "awg"
            ctype = "awg-node"
    if any(proto == "udp" and 51820 <= port <= 52000 for proto, port in ports):
        conf = max(conf, 0.7)
        evidence.append("port_wg_udp")
        if kind == "unknown":
            kind = "awg"
            ctype = "awg-node"

    return {"kind": kind, "type": ctype, "confidence": conf, "evidence": evidence}


def _parse_wg_interfaces(output: str) -> list[str]:
    interfaces: list[str] = []
    for raw in output.strip().split():
        try:
            interfaces.append(_sanitize_interface_name(raw))
        except WireGuardCommandError:
            continue
    return interfaces


def _parse_ip_addr_json(output: str) -> list[dict]:
    try:
        data = json.loads(output) if output.strip() else []
    except json.JSONDecodeError:
        return []
    return data if isinstance(data, list) else []


def _extract_ipv4_host_cidrs(allowed_ips: str) -> list[str]:
    out: list[str] = []
    for token in allowed_ips.split(","):
        cidr = token.strip()
        if not cidr:
            continue
        try:
            net = ipaddress.ip_network(cidr, strict=False)
        except ValueError:
            continue
        if net.version != 4 or net.prefixlen != 32:
            continue
        out.append(str(net))
    return out


def _subnets_for_allowed_ips(
    allowed_ips: str, prefixlen: int = _CLIENT_SUBNET_PREFIXLEN
) -> list[str]:
    """Return unique subnet CIDRs (e.g. /24) that cover each host in allowed_ips."""
    seen: set[str] = set()
    out: list[str] = []
    for host_cidr in _extract_ipv4_host_cidrs(allowed_ips):
        try:
            addr = ipaddress.ip_address(host_cidr.split("/")[0])
            net = ipaddress.ip_network(f"{addr}/{prefixlen}", strict=False)
            cidr = str(net)
            if cidr not in seen:
                seen.add(cidr)
                out.append(cidr)
        except ValueError:
            continue
    return out


def _sanitize_mbit(value: int | float, *, fallback: int = 1) -> int:
    try:
        ivalue = int(value)
    except (TypeError, ValueError):
        return fallback
    return min(max(ivalue, 1), 100_000)


def _extract_internal_ip(addresses: list[dict], interface_name: str) -> str:
    for iface in addresses:
        if iface.get("ifname") != interface_name:
            continue
        for addr in iface.get("addr_info") or []:
            local = str(addr.get("local") or "")
            if local and not local.startswith("127.") and local != "::1":
                return local
    return ""


def _compute_health(peers: list[dict], latency_ms: float) -> float:
    """Health score from command latency and active handshake ratio."""
    now_ts = int(datetime.now(timezone.utc).timestamp())
    peer_count = len(peers)
    if peer_count == 0:
        handshake_factor = 1.0
    else:
        active = 0
        for peer in peers:
            last = int(peer.get("last_handshake") or 0)
            if last > 0 and (now_ts - last) <= 180:
                active += 1
        # Keep idle peers from pushing node health to "unhealthy":
        # stale/no handshakes should degrade placement preference, not remove node eligibility.
        handshake_ratio = active / peer_count
        handshake_factor = 0.5 + (0.5 * handshake_ratio)

    latency_factor = max(0.0, 1.0 - min(latency_ms / 3000.0, 1.0))
    return max(0.0, min(1.0, (0.7 * handshake_factor) + (0.3 * latency_factor)))


class DockerNodeRuntimeAdapter(NodeRuntimeAdapter):
    """Discover AmneziaWG containers via docker exec wg."""

    def __init__(self, container_filter: str = "amnezia-awg", interface: str = "awg0"):
        self._container_prefix = container_filter
        self._container_prefixes: list[str] = [
            p.strip() for p in container_filter.split(",") if p.strip()
        ]
        if not self._container_prefixes:
            self._container_prefixes = ["amnezia-awg"]
        self._interface = _sanitize_interface_name(interface)

    def _candidate_interfaces(self) -> list[str]:
        """Preferred interface order. Keep default first, then common legacy names."""
        ordered = [self._interface, "awg0", "wg0"]
        out: list[str] = []
        seen: set[str] = set()
        for iface in ordered:
            try:
                s = _sanitize_interface_name(iface)
            except WireGuardCommandError:
                continue
            if s in seen:
                continue
            seen.add(s)
            out.append(s)
        return out

    async def _read_wg_dump(self, container_name: str) -> tuple[str, int, str, float]:
        """Read wg dump by probing known interfaces and discovered interfaces."""
        started = time.perf_counter()
        attempted: set[str] = set()
        last_code = 1
        last_output = ""

        async def try_iface(iface: str) -> tuple[int, str]:
            return await _docker_exec(container_name, ["wg", "show", iface, "dump"], timeout=15.0)

        for iface in self._candidate_interfaces():
            attempted.add(iface)
            code, output = await try_iface(iface)
            last_code, last_output = code, output
            if code == 0:
                return iface, code, output, (time.perf_counter() - started) * 1000.0

        code, output = await _docker_exec(
            container_name, ["wg", "show", "interfaces"], timeout=10.0
        )
        if code == 0:
            for iface in _parse_wg_interfaces(output):
                if iface in attempted:
                    continue
                attempted.add(iface)
                c2, o2 = await try_iface(iface)
                last_code, last_output = c2, o2
                if c2 == 0:
                    return iface, c2, o2, (time.perf_counter() - started) * 1000.0
        else:
            last_code, last_output = code, output

        return self._interface, last_code, last_output, (time.perf_counter() - started) * 1000.0

    async def _discover_container_names(self) -> list[str]:
        def _list() -> list[str]:
            import docker

            client = docker.from_env()
            out: list[str] = []
            for c in client.containers.list():
                name = (c.name or "").lstrip("/")
                if not name:
                    continue
                if not any(name.startswith(p) for p in self._container_prefixes):
                    continue
                try:
                    out.append(_sanitize_container_name(name))
                except WireGuardCommandError:
                    _log.debug("Skip container name (invalid): %r", name[:64])
            return out

        try:
            return await asyncio.to_thread(_list)
        except Exception as e:
            raise NodeDiscoveryError(str(e)[:200]) from e

    async def _discover_containers(self) -> list[dict]:
        def _list() -> list[dict]:
            import docker

            client = docker.from_env()
            out: list[dict] = []
            for c in client.containers.list():
                attrs = getattr(c, "attrs", None) or {}
                state = attrs.get("State") or {}
                if state.get("Status") != "running":
                    continue
                name = (c.name or "").lstrip("/")
                if not any(name.startswith(p) for p in self._container_prefixes):
                    continue
                cid = (c.id or "")[:12]
                image = (attrs.get("Config") or {}).get("Image") or attrs.get("Image") or ""
                image_refs = [image, c.image.id if getattr(c, "image", None) else ""]
                try:
                    digests = (c.image.attrs or {}).get("RepoDigests") or []
                    image_refs.extend(list(digests))
                except Exception:
                    pass
                classification = _classify_container_inspect(attrs, [r for r in image_refs if r])
                out.append(
                    {
                        "container_id": cid,
                        "container_name": name,
                        "classification": classification,
                    }
                )
            return out

        try:
            return await asyncio.to_thread(_list)
        except Exception as e:
            raise NodeDiscoveryError(str(e)[:200]) from e

    async def _discover_one(
        self,
        container_id: str,
        container_name: str | None = None,
        classification: dict | None = None,
        host_id: str | None = None,
    ) -> NodeMetadata:
        if container_name is None:
            container_name = container_id
        if classification is None:
            classification = {}
        if host_id is None:
            host_id = _ensure_host_id()
        node_id = f"docker:{container_id}"
        iface, wg_code, wg_output, latency_ms = await self._read_wg_dump(container_id)

        now = datetime.now(timezone.utc)
        if wg_code != 0:
            return NodeMetadata(
                node_id=node_id,
                container_name=container_name,
                container_id=container_id,
                host_id=host_id,
                classification=classification,
                confidence=classification.get("confidence"),
                evidence=classification.get("evidence"),
                interface_name=iface,
                status="unhealthy",
                health_score=0.0,
                peer_count=0,
                total_rx_bytes=0,
                total_tx_bytes=0,
                listen_port=0,
                public_key="",
                endpoint_ip="",
                internal_ip="",
                last_seen=now,
                capabilities={"obfuscation": True},
                max_peers=1000,
                is_draining=False,
                latency_ms=latency_ms,
            )

        public_key, listen_port, peers = _parse_wg_dump(wg_output)
        ip_code, ip_output = await _docker_exec(
            container_id, ["ip", "-j", "addr", "show", iface], timeout=10.0
        )
        addresses = _parse_ip_addr_json(ip_output) if ip_code == 0 else []
        internal_ip = _extract_internal_ip(addresses, iface)
        total_rx = sum(int(p.get("transfer_rx") or 0) for p in peers)
        total_tx = sum(int(p.get("transfer_tx") or 0) for p in peers)
        health_score = _compute_health(peers, latency_ms=latency_ms)
        # Connected peers: recent handshakes only (same 180s window as health computation).
        now_ts = int(datetime.now(timezone.utc).timestamp())
        active_peers = 0
        for p in peers:
            hs = int(p.get("last_handshake") or 0)
            if hs > 0 and (now_ts - hs) <= 180:
                active_peers += 1

        return NodeMetadata(
            node_id=node_id,
            container_name=container_name,
            container_id=container_id,
            host_id=host_id,
            classification=classification,
            confidence=classification.get("confidence"),
            evidence=classification.get("evidence"),
            interface_name=iface,
            public_key=public_key,
            listen_port=listen_port,
            endpoint_ip=internal_ip,
            internal_ip=internal_ip,
            peer_count=len(peers),
            active_peers=active_peers,
            total_rx_bytes=total_rx,
            total_tx_bytes=total_tx,
            status=_node_status(health_score),
            last_seen=now,
            capabilities={"obfuscation": True},
            health_score=health_score,
            max_peers=1000,
            is_draining=False,
            latency_ms=latency_ms,
        )

    async def discover_nodes(self) -> list[NodeMetadata]:
        try:
            containers = await self._discover_containers()
        except Exception as exc:
            _log.warning("Node discovery failed: %s", type(exc).__name__)
            return []
        if not containers:
            return []
        nodes: list[NodeMetadata] = []
        host_id = _ensure_host_id()
        for c in containers:
            try:
                classification = c.get("classification") or {}
                kind = classification.get("kind")
                confidence = float(classification.get("confidence") or 0.0)
                container_id = c.get("container_id") or ""
                container_name = c.get("container_name") or container_id
                if not container_id:
                    continue
                if kind != "awg" and confidence < 0.6:
                    continue
                nodes.append(
                    await self._discover_one(container_id, container_name, classification, host_id)
                )
            except Exception as exc:  # keep discovery loop resilient
                _log.warning(
                    "Discovery failed for container=%s: %s",
                    c.get("container_name"),
                    type(exc).__name__,
                )
                nodes.append(
                    NodeMetadata(
                        node_id=f"docker:{c.get('container_id') or ''}",
                        container_name=str(c.get("container_name") or ""),
                        container_id=str(c.get("container_id") or ""),
                        host_id=host_id,
                        classification=c.get("classification"),
                        confidence=(c.get("classification") or {}).get("confidence"),
                        evidence=(c.get("classification") or {}).get("evidence"),
                        interface_name=self._interface,
                        status="unhealthy",
                        health_score=0.0,
                        peer_count=0,
                        total_rx_bytes=0,
                        total_tx_bytes=0,
                        listen_port=0,
                        public_key="",
                        endpoint_ip="",
                        internal_ip="",
                        last_seen=datetime.now(timezone.utc),
                        capabilities={"obfuscation": True},
                        max_peers=1000,
                        is_draining=False,
                    )
                )
        # Deduplicate by container_name: keep single node per name (best health)
        by_name: dict[str, NodeMetadata] = {}
        for node in nodes:
            name = node.container_name or node.node_id
            existing = by_name.get(name)
            if existing is None or (node.health_score or 0) > (existing.health_score or 0):
                by_name[name] = node
        return list(by_name.values())

    async def _resolve_node(self, node_id: str) -> NodeMetadata | None:
        nodes = await self.discover_nodes()
        for node in nodes:
            if node.node_id == node_id:
                return node
        for node in nodes:
            if node.container_name == node_id:
                return node
        # Single-node: use the only node so issue/reissue work regardless of server_id (e.g. vpn-node-1 from seed_agent_server).
        if len(nodes) == 1:
            return nodes[0]
        return None

    async def health_check(self, node_id: str) -> dict:
        node = await self._resolve_node(node_id)
        if not node:
            return {"status": "unknown", "latency_ms": None, "handshake_ok": None}
        container_name = node.container_name
        interface = _sanitize_interface_name(node.interface_name or self._interface)
        started = time.perf_counter()
        code, output = await _docker_exec(
            container_name, ["wg", "show", interface, "dump"], timeout=10.0
        )
        latency_ms = (time.perf_counter() - started) * 1000.0
        if code != 0:
            return {"status": "unreachable", "latency_ms": latency_ms, "handshake_ok": False}
        _, _, peers = _parse_wg_dump(output)
        now_ts = int(datetime.now(timezone.utc).timestamp())
        handshake_ok = (
            any(
                (int(p.get("last_handshake") or 0) > 0)
                and ((now_ts - int(p.get("last_handshake") or 0)) <= 180)
                for p in peers
            )
            if peers
            else True
        )
        return {
            "status": "ok" if handshake_ok else "degraded",
            "latency_ms": latency_ms,
            "handshake_ok": handshake_ok,
        }

    async def add_peer(self, node_id: str, peer_config: PeerConfigLike) -> None:
        node = await self._resolve_node(node_id)
        if not node:
            raise WireGuardCommandError(
                f"Node not found: {node_id}", command="docker exec wg set", output=""
            )
        container_name = node.container_name
        interface = _sanitize_interface_name(node.interface_name or self._interface)
        public_key = _sanitize_public_key(peer_config.public_key)
        raw_allowed = peer_config.allowed_ips or ""
        if not raw_allowed.strip() or "0.0.0.0/0" in raw_allowed:
            raise WireGuardCommandError(
                "Server peer AllowedIPs must be client tunnel /32 (e.g. 10.8.1.2/32), not 0.0.0.0/0",
                command="add_peer",
                output=raw_allowed[:32],
            )
        allowed_ips = _sanitize_allowed_ips(raw_allowed.strip())
        target_cidrs = set(_extract_ipv4_host_cidrs(allowed_ips))

        existing_peers = await self.list_peers(node_id)
        allowed_before = ""
        for p in existing_peers:
            if p.get("public_key") == public_key:
                allowed_before = (p.get("allowed_ips") or "").strip()
                break
        for p in existing_peers:
            if p.get("public_key") == public_key:
                continue
            other_ips = (p.get("allowed_ips") or "").strip()
            other_cidrs = set(_extract_ipv4_host_cidrs(other_ips))
            if target_cidrs & other_cidrs:
                conflict = ", ".join(target_cidrs & other_cidrs)
                raise WireGuardCommandError(
                    f"allowed_ips conflict: {conflict} already assigned to another peer",
                    command="add_peer",
                    output=conflict[:64],
                )

        keepalive = _clamp_keepalive(peer_config.persistent_keepalive)
        if peer_config.preshared_key:
            key_b64 = peer_config.preshared_key.strip().replace("'", "'\"'\"'")
            script = f"printf '%s\\n' '{key_b64}' | wg set {interface} peer {public_key} allowed-ips {allowed_ips} persistent-keepalive {keepalive} preshared-key /dev/stdin"
            cmd = ["sh", "-c", script]
        else:
            cmd = [
                "wg",
                "set",
                interface,
                "peer",
                public_key,
                "allowed-ips",
                allowed_ips,
                "persistent-keepalive",
                str(keepalive),
            ]
        code, output = await _docker_exec(container_name, cmd, timeout=15.0)
        if code != 0:
            raise WireGuardCommandError(
                "wg set failed", command="docker exec wg set", output=output[:400]
            )

        peers_after = await self.list_peers(node_id)
        applied = ""
        for p in peers_after:
            if p.get("public_key") == public_key:
                applied = (p.get("allowed_ips") or "").strip()
                break
        expected_cidrs = set(_extract_ipv4_host_cidrs(allowed_ips))
        applied_cidrs = set(_extract_ipv4_host_cidrs(applied))
        if expected_cidrs != applied_cidrs:
            raise WireGuardCommandError(
                "Verification failed: allowed_ips not applied on node",
                command="add_peer",
                output=f"expected={allowed_ips[:48]} got={applied[:48]}",
            )

        _log.info(
            "add_peer applied allowed_ips node_id=%s iface=%s pubkey=%s allowed_before=%s allowed_after=%s",
            node_id,
            interface,
            public_key[:12] + "…" if len(public_key) > 12 else public_key,
            allowed_before or "(none)",
            allowed_ips,
        )
        subnets = _subnets_for_allowed_ips(allowed_ips)
        if subnets:
            await _ensure_client_subnet_routes(container_name, interface, subnets)

        # Persist config to disk so it survives container restarts.
        await _persist_wg_config(container_name, interface)

    async def remove_peer(self, node_id: str, peer_public_key: str) -> None:
        node = await self._resolve_node(node_id)
        if not node:
            raise WireGuardCommandError(
                f"Node not found: {node_id}", command="docker exec wg set", output=""
            )
        container_name = node.container_name
        interface = _sanitize_interface_name(node.interface_name or self._interface)
        public_key = _sanitize_public_key(peer_public_key)
        code, output = await _docker_exec(
            container_name,
            ["wg", "set", interface, "peer", public_key, "remove"],
            timeout=15.0,
        )
        if code != 0:
            raise WireGuardCommandError(
                "wg set remove failed",
                command="docker exec wg set peer remove",
                output=output[:400],
            )

        # Persist config to disk so it survives container restarts.
        await _persist_wg_config(container_name, interface)

    async def ensure_reply_routes(self, node_id: str) -> None:
        """Ensure reply routes for all current peers on the node (idempotent)."""
        node = await self._resolve_node(node_id)
        if not node:
            return
        container_name = node.container_name
        interface = _sanitize_interface_name(node.interface_name or self._interface)
        peers = await self.list_peers(node_id)
        seen: set[str] = set()
        subnets: list[str] = []
        for p in peers or []:
            allowed = (p.get("allowed_ips") or "").strip()
            for cidr in _subnets_for_allowed_ips(allowed):
                if cidr not in seen:
                    seen.add(cidr)
                    subnets.append(cidr)
        if subnets:
            await _ensure_client_subnet_routes(container_name, interface, subnets)

    async def get_obfuscation_from_node(self, node_id: str) -> dict | None:
        """Fetch AmneziaWG obfuscation params (Jc, Jmin, Jmax, S1, S2, H1-H4) from runtime. Returns None on failure."""
        node = await self._resolve_node(node_id)
        if not node:
            return None
        container_name = node.container_name
        interface = _sanitize_interface_name(node.interface_name or self._interface)
        code, output = await _docker_exec(container_name, ["wg", "show", interface], timeout=10.0)
        if code != 0:
            return None
        return _parse_wg_show_obfuscation(output)

    async def list_peers(self, node_id: str) -> list[dict]:
        node = await self._resolve_node(node_id)
        if not node:
            return []
        container_name = node.container_name
        interface = _sanitize_interface_name(node.interface_name or self._interface)
        code, output = await _docker_exec(
            container_name, ["wg", "show", interface, "dump"], timeout=15.0
        )
        if code != 0:
            return []
        _, _, peers = _parse_wg_dump(output)
        return peers

    async def get_container_stats(self, container_name: str) -> dict | None:
        """Return CPU/RAM stats for a container via Docker SDK. Optional for snapshot."""

        def _stats() -> dict | None:
            import docker

            client = docker.from_env()
            try:
                c = client.containers.get(container_name)
                s = c.stats(stream=False)
            except Exception:
                return None
            try:
                cpu_delta = (s.get("cpu_stats", {}) or {}).get("cpu_usage", {}) or {}
                precpu = (s.get("precpu_stats", {}) or {}).get("cpu_usage", {}) or {}
                mem = (s.get("memory_stats", {}) or {}).get("usage") or 0
                mem_limit = (s.get("memory_stats", {}) or {}).get("limit") or 1
                cpu_pct = None
                if cpu_delta and precpu:
                    total = cpu_delta.get("total_usage", 0) - precpu.get("total_usage", 0)
                    system = (s.get("cpu_stats") or {}).get("system_cpu_usage") or 0
                    sys_prev = (s.get("precpu_stats") or {}).get("system_cpu_usage") or 0
                    if system > sys_prev:
                        cpu_pct = (total / (system - sys_prev)) * 100.0
                ram_pct = (mem / mem_limit * 100) if mem_limit else None
                return {
                    "cpu_pct": cpu_pct,
                    "ram_pct": ram_pct,
                    "ram_used_bytes": mem if isinstance(mem, int) else None,
                    "ram_total_bytes": mem_limit if isinstance(mem_limit, int) else None,
                }
            except (KeyError, TypeError, ZeroDivisionError):
                return None

        try:
            return await asyncio.to_thread(_stats)
        except Exception:
            return None

    async def enforce_bandwidth_policies(
        self,
        node_id: str,
        *,
        policies: list[dict],
        peer_bindings: list[dict],
        dry_run: bool = False,
    ) -> dict:
        node = await self._resolve_node(node_id)
        if not node:
            raise WireGuardCommandError(
                f"Node not found: {node_id}", command="docker exec tc", output=""
            )
        container_name = node.container_name
        interface = _sanitize_interface_name(node.interface_name or self._interface)

        class_by_plan: dict[str, str] = {}
        policy_rows = sorted(policies, key=lambda p: str(p.get("plan_id") or ""))
        class_minor = 10
        commands: list[list[str]] = []
        commands.append(
            [
                "tc",
                "qdisc",
                "replace",
                "dev",
                interface,
                "root",
                "handle",
                "1:",
                "htb",
                "default",
                "999",
            ]
        )
        commands.append(
            [
                "tc",
                "class",
                "replace",
                "dev",
                interface,
                "parent",
                "1:",
                "classid",
                "1:999",
                "htb",
                "rate",
                "100000mbit",
                "ceil",
                "100000mbit",
                "prio",
                "7",
            ]
        )
        for policy in policy_rows:
            plan_id = str(policy.get("plan_id") or "")
            if not plan_id:
                continue
            raw_rate = policy.get("rate_mbps")
            rate = _sanitize_mbit(int(raw_rate) if raw_rate is not None else 1, fallback=1)
            ceil = _sanitize_mbit(policy.get("ceil_mbps") or rate, fallback=rate)
            if ceil < rate:
                ceil = rate
            prio = min(max(int(policy.get("priority") or 3), 0), 7)
            classid = f"1:{class_minor}"
            class_minor += 1
            class_by_plan[plan_id] = classid
            commands.append(
                [
                    "tc",
                    "class",
                    "replace",
                    "dev",
                    interface,
                    "parent",
                    "1:",
                    "classid",
                    classid,
                    "htb",
                    "rate",
                    f"{rate}mbit",
                    "ceil",
                    f"{ceil}mbit",
                    "prio",
                    str(prio),
                ]
            )

        # Reset policy-managed filters at fixed pref=100 to avoid stale duplicates.
        commands.append(
            [
                "tc",
                "filter",
                "del",
                "dev",
                interface,
                "parent",
                "1:",
                "pref",
                "100",
                "protocol",
                "ip",
            ]
        )
        bound_peer_count = 0
        skipped_no_host_ip = 0
        for binding in peer_bindings:
            plan_id = str(binding.get("plan_id") or "")
            classid = class_by_plan.get(plan_id)
            if classid is None:
                continue
            cid: str = classid
            host_cidrs = _extract_ipv4_host_cidrs(str(binding.get("allowed_ips") or ""))
            if not host_cidrs:
                skipped_no_host_ip += 1
                continue
            bound_peer_count += 1
            for cidr in host_cidrs:
                commands.append(
                    [
                        "tc",
                        "filter",
                        "add",
                        "dev",
                        interface,
                        "parent",
                        "1:",
                        "pref",
                        "100",
                        "protocol",
                        "ip",
                        "u32",
                        "match",
                        "ip",
                        "dst",
                        cidr,
                        "flowid",
                        cid,
                    ]
                )
                commands.append(
                    [
                        "tc",
                        "filter",
                        "add",
                        "dev",
                        interface,
                        "parent",
                        "1:",
                        "pref",
                        "100",
                        "protocol",
                        "ip",
                        "u32",
                        "match",
                        "ip",
                        "src",
                        cidr,
                        "flowid",
                        cid,
                    ]
                )

        if dry_run:
            return {
                "dry_run": True,
                "commands": [" ".join(command) for command in commands],
                "classes": len(class_by_plan),
                "bound_peers": bound_peer_count,
                "skipped_no_host_ip": skipped_no_host_ip,
            }

        executed = 0
        for command in commands:
            code, output = await _docker_exec(container_name, command, timeout=15.0)
            # Ignore cleanup failure when no previous filters exist.
            if command[:3] == ["tc", "filter", "del"] and code != 0:
                continue
            if code != 0:
                raise WireGuardCommandError(
                    "tc apply failed",
                    command="docker exec " + " ".join(command[:8]),
                    output=output[:400],
                )
            executed += 1
        return {
            "dry_run": False,
            "commands_executed": executed,
            "classes": len(class_by_plan),
            "bound_peers": bound_peer_count,
            "skipped_no_host_ip": skipped_no_host_ip,
        }
