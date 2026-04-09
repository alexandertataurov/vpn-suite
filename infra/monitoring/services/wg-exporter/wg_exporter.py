#!/usr/bin/env python3
"""Minimal WireGuard exporter for AmneziaWG containers.

Executes `wg show <iface> dump` inside a target container via docker exec.
Exposes basic Prometheus metrics on /metrics.
"""
from __future__ import annotations

import hashlib
import os
import time
import subprocess
from http.server import BaseHTTPRequestHandler, HTTPServer

WG_CONTAINER = os.environ.get("WG_CONTAINER", "amnezia-awg2")
WG_INTERFACE = os.environ.get("WG_INTERFACE", "awg0")
LISTEN_ADDR = os.environ.get("WG_EXPORTER_ADDR", "0.0.0.0")
LISTEN_PORT = int(os.environ.get("WG_EXPORTER_PORT", "9586"))
NODE_ID = os.environ.get("NODE_ID", "")
SERVER_ID = os.environ.get("SERVER_ID", "")
EXPOSE_PEER_META = os.environ.get("WG_EXPORTER_EXPOSE_PEER_META", "").strip().lower() in (
    "1",
    "true",
    "yes",
)


def _extra_labels() -> str:
    """Labels for correlation with control-plane topology."""
    parts = []
    if NODE_ID:
        parts.append(f'node_id="{NODE_ID}"')
    if SERVER_ID:
        parts.append(f'server_id="{SERVER_ID}"')
    return ",".join(parts) if parts else ""


def _labels_suffix(extra: str) -> str:
    """Prometheus labels string, e.g. {node_id=\"x\"} or empty."""
    return "{" + extra + "}" if extra else ""


def _peer_labels(peer: str, extra: str) -> str:
    """Prometheus labels for peer metrics: {peer=\"x\",node_id=\"y\",...}."""
    lbls = [f'peer="{peer}"']
    if extra:
        lbls.append(extra)
    return "{" + ",".join(lbls) + "}"


def _run(cmd: list[str]) -> tuple[int, str]:
    try:
        res = subprocess.run(cmd, stdout=subprocess.PIPE, stderr=subprocess.STDOUT, check=False, text=True, timeout=5)
        return res.returncode, res.stdout
    except Exception as exc:
        return 1, str(exc)


def _wg_dump() -> tuple[bool, str]:
    # Try configured interface first, then wg0 fallback.
    for iface in (WG_INTERFACE, "wg0"):
        code, out = _run(["docker", "exec", WG_CONTAINER, "wg", "show", iface, "dump"])
        if code == 0 and out.strip():
            return True, out
    return False, out if "out" in locals() else ""


def _parse_dump(raw: str) -> dict:
    lines = [l for l in (raw or "").splitlines() if l.strip()]
    if not lines:
        return {"peers": []}
    header = lines[0].split("\t")
    iface = header[0] if header else ""
    listen_port = int(header[2]) if len(header) > 2 and header[2].isdigit() else 0
    peers = []
    for line in lines[1:]:
        parts = line.split("\t")
        if len(parts) < 8:
            continue
        peer_pub = parts[0]
        endpoint = parts[2]
        allowed_ips = parts[3]
        last_handshake = int(parts[4]) if parts[4].isdigit() else 0
        rx = int(parts[5]) if parts[5].isdigit() else 0
        tx = int(parts[6]) if parts[6].isdigit() else 0
        peers.append({
            "peer": peer_pub,
            "endpoint": endpoint,
            "allowed_ips": allowed_ips,
            "last_handshake": last_handshake,
            "rx": rx,
            "tx": tx,
        })
    return {"interface": iface, "listen_port": listen_port, "peers": peers}


def _format_metrics() -> str:
    ok, raw = _wg_dump()
    now = int(time.time())
    extra = _extra_labels()
    suffix = _labels_suffix(extra)
    metrics = []
    metrics.append("# HELP wireguard_up Whether wg dump succeeded")
    metrics.append("# TYPE wireguard_up gauge")
    metrics.append(f"wireguard_up{suffix} {1 if ok else 0}")
    if not ok:
        return "\n".join(metrics) + "\n"
    data = _parse_dump(raw)
    peers = data.get("peers", [])

    metrics.append("# HELP wireguard_peers Total number of peers")
    metrics.append("# TYPE wireguard_peers gauge")
    metrics.append(f"wireguard_peers{suffix} {len(peers)}")

    # Peers with handshake older than 5m (stale); useful for handshake health alerting
    stale_5m = 300
    stale_count = sum(1 for p in peers if (now - int(p.get("last_handshake") or 0)) > stale_5m)
    metrics.append("# HELP wireguard_peers_handshake_stale_count Peers with last handshake > 5m ago")
    metrics.append("# TYPE wireguard_peers_handshake_stale_count gauge")
    metrics.append(f"wireguard_peers_handshake_stale_count{suffix} {stale_count}")

    metrics.append("# HELP wireguard_listen_port Listen port")
    metrics.append("# TYPE wireguard_listen_port gauge")
    metrics.append(f"wireguard_listen_port{suffix} {data.get('listen_port', 0)}")

    metrics.append("# HELP wireguard_received_bytes Received bytes per peer")
    metrics.append("# TYPE wireguard_received_bytes counter")
    metrics.append("# HELP wireguard_sent_bytes Sent bytes per peer")
    metrics.append("# TYPE wireguard_sent_bytes counter")
    metrics.append("# HELP wireguard_latest_handshake_seconds Seconds since last handshake per peer")
    metrics.append("# TYPE wireguard_latest_handshake_seconds gauge")
    if EXPOSE_PEER_META:
        metrics.append("# HELP wireguard_peer_allowed_ips_count Allowed IPs count per peer (best-effort)")
        metrics.append("# TYPE wireguard_peer_allowed_ips_count gauge")
        metrics.append("# HELP wireguard_peer_allowed_ips_hash_info Allowed IPs hash per peer (value is always 1)")
        metrics.append("# TYPE wireguard_peer_allowed_ips_hash_info gauge")
        metrics.append("# HELP wireguard_peer_endpoint_host_info Endpoint host per peer (value is always 1)")
        metrics.append("# TYPE wireguard_peer_endpoint_host_info gauge")

    for p in peers:
        peer = p.get("peer", "unknown")
        rx = int(p.get("rx") or 0)
        tx = int(p.get("tx") or 0)
        last = int(p.get("last_handshake") or 0)
        age = now - last if last > 0 else 0
        pl = _peer_labels(peer, extra)
        metrics.append(f"wireguard_received_bytes{pl} {rx}")
        metrics.append(f"wireguard_sent_bytes{pl} {tx}")
        metrics.append(f"wireguard_latest_handshake_seconds{pl} {age}")
        if EXPOSE_PEER_META:
            endpoint = str(p.get("endpoint") or "")
            allowed_ips = str(p.get("allowed_ips") or "")
            allowed_ips_count = len([x for x in allowed_ips.split(",") if x.strip()]) if allowed_ips else 0
            allowed_ips_hash = hashlib.sha256(allowed_ips.encode("utf-8")).hexdigest()[:12] if allowed_ips else ""
            # Endpoint label: best-effort host part only to reduce churn/cardinality.
            endpoint_host = endpoint.rsplit(":", 1)[0] if ":" in endpoint else endpoint

            # These are "info-style" metrics: value always 1, labels carry metadata.
            if allowed_ips_hash:
                metrics.append(
                    f'wireguard_peer_allowed_ips_hash_info{{peer="{peer}",allowed_ips_hash="{allowed_ips_hash}"'
                    + ("," + extra if extra else "")
                    + "} 1"
                )
            if endpoint_host:
                metrics.append(
                    f'wireguard_peer_endpoint_host_info{{peer="{peer}",endpoint_host="{endpoint_host}"'
                    + ("," + extra if extra else "")
                    + "} 1"
                )
            metrics.append(f"wireguard_peer_allowed_ips_count{pl} {allowed_ips_count}")

    return "\n".join(metrics) + "\n"


class Handler(BaseHTTPRequestHandler):
    def do_GET(self):  # noqa: N802
        if self.path != "/metrics":
            self.send_response(404)
            self.end_headers()
            return
        payload = _format_metrics().encode("utf-8")
        self.send_response(200)
        self.send_header("Content-Type", "text/plain; version=0.0.4")
        self.send_header("Content-Length", str(len(payload)))
        self.end_headers()
        self.wfile.write(payload)

    def log_message(self, format, *args):  # noqa: A003
        return


def main() -> None:
    server = HTTPServer((LISTEN_ADDR, LISTEN_PORT), Handler)
    server.serve_forever()


if __name__ == "__main__":
    main()
