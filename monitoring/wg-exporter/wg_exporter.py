#!/usr/bin/env python3
"""Minimal WireGuard exporter for AmneziaWG containers.

Executes `wg show <iface> dump` inside a target container via docker exec.
Exposes basic Prometheus metrics on /metrics.
"""
from __future__ import annotations

import os
import time
import subprocess
from http.server import BaseHTTPRequestHandler, HTTPServer

WG_CONTAINER = os.environ.get("WG_CONTAINER", "amnezia-awg2")
WG_INTERFACE = os.environ.get("WG_INTERFACE", "awg0")
LISTEN_ADDR = os.environ.get("WG_EXPORTER_ADDR", "0.0.0.0")
LISTEN_PORT = int(os.environ.get("WG_EXPORTER_PORT", "9586"))


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
        last_handshake = int(parts[4]) if parts[4].isdigit() else 0
        rx = int(parts[5]) if parts[5].isdigit() else 0
        tx = int(parts[6]) if parts[6].isdigit() else 0
        peers.append({
            "peer": peer_pub,
            "last_handshake": last_handshake,
            "rx": rx,
            "tx": tx,
        })
    return {"interface": iface, "listen_port": listen_port, "peers": peers}


def _format_metrics() -> str:
    ok, raw = _wg_dump()
    now = int(time.time())
    metrics = []
    metrics.append("# HELP wireguard_up Whether wg dump succeeded")
    metrics.append("# TYPE wireguard_up gauge")
    metrics.append(f"wireguard_up {1 if ok else 0}")
    if not ok:
        return "\n".join(metrics) + "\n"
    data = _parse_dump(raw)
    peers = data.get("peers", [])

    metrics.append("# HELP wireguard_peers Total number of peers")
    metrics.append("# TYPE wireguard_peers gauge")
    metrics.append(f"wireguard_peers {len(peers)}")

    metrics.append("# HELP wireguard_listen_port Listen port")
    metrics.append("# TYPE wireguard_listen_port gauge")
    metrics.append(f"wireguard_listen_port {data.get('listen_port', 0)}")

    metrics.append("# HELP wireguard_received_bytes Received bytes per peer")
    metrics.append("# TYPE wireguard_received_bytes counter")
    metrics.append("# HELP wireguard_sent_bytes Sent bytes per peer")
    metrics.append("# TYPE wireguard_sent_bytes counter")
    metrics.append("# HELP wireguard_latest_handshake_seconds Seconds since last handshake per peer")
    metrics.append("# TYPE wireguard_latest_handshake_seconds gauge")

    for p in peers:
        peer = p.get("peer", "unknown")
        rx = int(p.get("rx") or 0)
        tx = int(p.get("tx") or 0)
        last = int(p.get("last_handshake") or 0)
        age = now - last if last > 0 else 0
        metrics.append(f"wireguard_received_bytes{{peer=\"{peer}\"}} {rx}")
        metrics.append(f"wireguard_sent_bytes{{peer=\"{peer}\"}} {tx}")
        metrics.append(f"wireguard_latest_handshake_seconds{{peer=\"{peer}\"}} {age}")

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
