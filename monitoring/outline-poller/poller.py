#!/usr/bin/env python3
import json
import os
import threading
import time
from http.server import BaseHTTPRequestHandler, HTTPServer

import requests
from prometheus_client import CONTENT_TYPE_LATEST, Counter, Gauge, generate_latest

OUTLINE_ACCESS_KEYS_TOTAL = Gauge("outline_access_keys_total", "Number of Outline access keys")
OUTLINE_ACCESS_KEYS_CREATED = Counter(
    "outline_access_keys_created_total",
    "Outline access keys created (diff since poller start)",
)
OUTLINE_ACCESS_KEYS_REVOKED = Counter(
    "outline_access_keys_revoked_total",
    "Outline access keys revoked (diff since poller start)",
)
OUTLINE_POLL_SUCCESS = Gauge("outline_poll_success", "1 if last poll succeeded, else 0")
OUTLINE_POLL_ERRORS = Counter("outline_poll_errors_total", "Outline poll errors")


class Handler(BaseHTTPRequestHandler):
    def do_GET(self):
        if self.path == "/metrics":
            data = generate_latest()
            self.send_response(200)
            self.send_header("Content-Type", CONTENT_TYPE_LATEST)
            self.send_header("Content-Length", str(len(data)))
            self.end_headers()
            self.wfile.write(data)
            return
        if self.path == "/healthz":
            self.send_response(200)
            self.send_header("Content-Type", "application/json")
            self.end_headers()
            self.wfile.write(b"{\"ok\": true}")
            return
        self.send_response(404)
        self.end_headers()

    def log_message(self, fmt: str, *args):
        return


def _serve_http(port: int) -> None:
    httpd = HTTPServer(("0.0.0.0", port), Handler)
    httpd.serve_forever()


def _fetch_json(url: str, timeout: float) -> dict | None:
    try:
        r = requests.get(url, timeout=timeout, verify=False)
        if r.status_code != 200:
            return None
        return r.json()
    except Exception:
        return None


def _poll(base_url: str, timeout: float, prev_ids: set[str]) -> set[str]:
    keys_url = base_url.rstrip("/") + "/access-keys"
    data = _fetch_json(keys_url, timeout)
    if not data:
        OUTLINE_POLL_SUCCESS.set(0)
        OUTLINE_POLL_ERRORS.inc()
        return prev_ids

    keys = data.get("accessKeys") or []
    ids = {str(k.get("id")) for k in keys if k.get("id") is not None}
    OUTLINE_ACCESS_KEYS_TOTAL.set(len(ids))

    created = ids - prev_ids
    revoked = prev_ids - ids
    if created:
        OUTLINE_ACCESS_KEYS_CREATED.inc(len(created))
    if revoked:
        OUTLINE_ACCESS_KEYS_REVOKED.inc(len(revoked))

    OUTLINE_POLL_SUCCESS.set(1)
    return ids


def main() -> int:
    base_url = os.getenv("OUTLINE_MANAGER_URL", "").strip()
    if not base_url:
        raise RuntimeError("OUTLINE_MANAGER_URL is required")

    timeout = float(os.getenv("OUTLINE_TIMEOUT_SECONDS", "10"))
    interval = int(os.getenv("POLL_INTERVAL_SECONDS", "30"))
    http_port = int(os.getenv("HTTP_PORT", "9106"))

    t = threading.Thread(target=_serve_http, args=(http_port,), daemon=True)
    t.start()

    prev_ids: set[str] = set()
    while True:
        prev_ids = _poll(base_url, timeout, prev_ids)
        time.sleep(max(5, interval))


if __name__ == "__main__":
    raise SystemExit(main())
