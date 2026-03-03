#!/usr/bin/env python3
"""Print current AmneziaWG connections and traffic from agent heartbeats (Redis).

Run from repo root (mount backend so script is present without rebuild):
  docker compose run --rm -v "$(pwd)/backend:/app" admin-api python scripts/check_awg_connections.py [server_id]

Requires Redis with agent heartbeats (NODE_DISCOVERY=agent). For live data on the VPN
node itself, run there: docker exec <amnezia-container> wg show awg0
"""

import asyncio
import json
import os
import sys

# Allow run from repo root or backend dir; Docker uses /app
_root = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
if _root not in sys.path:
    sys.path.insert(0, _root)
if "/app" not in sys.path:
    sys.path.insert(0, "/app")


def _fmt_bytes(n: int | None) -> str:
    if n is None or n == 0:
        return "0 B"
    for u, s in [(1e9, "GB"), (1e6, "MB"), (1e3, "KB")]:
        if n >= u:
            return f"{n / u:.1f} {s}"
    return f"{n} B"


async def main() -> None:
    from app.core.constants import REDIS_KEY_AGENT_HB_PREFIX

    server_id_filter = sys.argv[1].strip() if len(sys.argv) > 1 else None

    redis_url = os.environ.get("REDIS_URL") or getattr(
        __import__("app.core.config", fromlist=["settings"]).settings, "redis_url", None
    )
    if not redis_url:
        print("Set REDIS_URL (e.g. redis://localhost:6379/0) or run from admin-api container.", file=sys.stderr)
        sys.exit(1)
    try:
        from redis.asyncio import Redis
        r = Redis.from_url(redis_url, decode_responses=True)
    except Exception as e:
        print(f"Redis connect failed: {e}", file=sys.stderr)
        sys.exit(1)

    keys = []
    async for k in r.scan_iter(match=f"{REDIS_KEY_AGENT_HB_PREFIX}*", count=100):
        keys.append(k)
        if server_id_filter and k == f"{REDIS_KEY_AGENT_HB_PREFIX}{server_id_filter}":
            break

    if server_id_filter and not any(k.endswith(server_id_filter) or k == f"{REDIS_KEY_AGENT_HB_PREFIX}{server_id_filter}" for k in keys):
        keys = [f"{REDIS_KEY_AGENT_HB_PREFIX}{server_id_filter}"]

    if not keys:
        print("No agent heartbeats in Redis. Start node-agent with SERVER_ID set.")
        await r.aclose()
        return

    try:
        for key in sorted(keys):
            raw = await r.get(key)
            if not raw:
                continue
            if isinstance(raw, bytes):
                raw = raw.decode("utf-8", errors="replace")
            try:
                hb = json.loads(raw)
            except Exception:
                continue
            sid = hb.get("server_id") or key.replace(REDIS_KEY_AGENT_HB_PREFIX, "")
            if server_id_filter and sid != server_id_filter:
                continue
            peer_count = int(hb.get("peer_count") or 0)
            total_rx = int(hb.get("total_rx_bytes") or 0)
            total_tx = int(hb.get("total_tx_bytes") or 0)
            print(f"\n=== Server: {sid} ===")
            print(f"  Peers: {peer_count}  |  RX: {_fmt_bytes(total_rx)}  |  TX: {_fmt_bytes(total_tx)}")
            print(f"  Container: {hb.get('container_name') or '—'}  |  Status: {hb.get('status') or '—'}")
            peers = hb.get("peers")
            if isinstance(peers, list) and peers:
                print("  --- Per peer ---")
                for p in peers:
                    if not isinstance(p, dict):
                        continue
                    pk = (p.get("public_key") or "")[:20] + "..." if (p.get("public_key") or "") else "—"
                    rx = int(p.get("rx_bytes") or 0)
                    tx = int(p.get("tx_bytes") or 0)
                    age = p.get("last_handshake_age_sec")
                    age_s = f"{age}s ago" if isinstance(age, (int, float)) and age >= 0 else "no handshake"
                    print(f"    {pk}  RX: {_fmt_bytes(rx)}  TX: {_fmt_bytes(tx)}  handshake: {age_s}")
    finally:
        await r.aclose()
    print()


if __name__ == "__main__":
    asyncio.run(main())
