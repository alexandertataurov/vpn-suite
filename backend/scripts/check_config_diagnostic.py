#!/usr/bin/env python3
"""Diagnostic: servers, devices, and (if agent) heartbeat keys. Run from repo root:
  docker compose run --rm admin-api python scripts/check_config_diagnostic.py
"""
import asyncio
import json
import os
import sys

sys.path.insert(0, "/app")


async def main() -> None:
    """Print servers, devices, and (if present) agent heartbeats.

    Optional CLI:
      python scripts/check_config_diagnostic.py <device_id> [<device_id>...]

    When device IDs are passed, the Devices section is filtered to those IDs
    (no limit) and includes per-device telemetry + reconciliation status
    from Redis, if available.
    """

    from sqlalchemy import select, text  # type: ignore[import]

    from app.core.constants import REDIS_KEY_AGENT_HB_PREFIX
    from app.core.database import async_session_factory
    from app.models import Device, Server
    from app.services.device_telemetry_cache import (
        get_device_telemetry_bulk,
        merge_telemetry_into_device,
    )

    filter_ids = [arg for arg in sys.argv[1:] if not arg.startswith("-")]

    print("=== Servers (public_key in DB) ===\n")
    async with async_session_factory() as db:
        r = await db.execute(
            select(
                Server.id,
                Server.name,
                Server.public_key,
                Server.public_key_synced_at,
                Server.api_endpoint,
            )
        )
        for row in r.all():
            sid, name, pk, synced, api = row
            pk_preview = (pk[:20] + "..." if pk and len(pk) > 20 else (pk or "(empty)"))
            print(f"  id={sid!r} name={name!r}")
            print(f"    public_key={pk_preview}  synced_at={synced}")
            print(f"    api_endpoint={api}")
            print()

    header = "=== Devices (client public_key, server_id, allowed_ips"
    header += ", telemetry" if filter_ids else ""
    header += ") ===\n"
    print(header)

    async with async_session_factory() as db:
        stmt = (
            select(
                Device.id,
                Device.server_id,
                Device.public_key,
                Device.allowed_ips,
                Device.revoked_at,
            )
            .order_by(Device.issued_at.desc())
        )
        if filter_ids:
            stmt = stmt.where(Device.id.in_(filter_ids))
        else:
            stmt = stmt.limit(20)

        r = await db.execute(stmt)
        rows = r.all()
        device_ids = [row[0] for row in rows]
        telemetry_map = (
            await get_device_telemetry_bulk(device_ids) if device_ids else {}
        )

        if filter_ids and not rows:
            print(f"  (no devices found for ids={filter_ids!r})\n")

        for row in rows:
            did, sid, pk, ips, rev = row
            pk_preview = (pk[:20] + "..." if pk and len(pk) > 20 else (pk or "(empty)"))
            print(f"  device_id={did!r} server_id={sid!r} revoked={bool(rev)}")
            print(f"    public_key( client )={pk_preview}")
            print(f"    allowed_ips(db)={ips!r}")

            telemetry = telemetry_map.get(str(did))
            if telemetry is not None:
                merged = merge_telemetry_into_device(
                    {
                        "revoked_at": rev,
                        "allowed_ips": ips,
                        "has_consumed_config": False,
                        "has_pending_config": False,
                    },
                    telemetry,
                )
                if merged is not None:
                    print(
                        "    telemetry: "
                        f"handshake_age_sec={merged.handshake_age_sec} "
                        f"rx={merged.transfer_rx_bytes} tx={merged.transfer_tx_bytes}"
                    )
                    print(
                        "    node: "
                        f"peer_present={merged.peer_present} "
                        f"node_health={merged.node_health} "
                        f"allowed_ips_on_node={merged.allowed_ips_on_node!r}"
                    )
                    print(
                        "    reconcile: "
                        f"status={merged.reconciliation_status} "
                        f"reason={merged.telemetry_reason!r}"
                    )
            print()

    redis_url = os.environ.get("REDIS_URL", "redis://redis:6379/0")
    try:
        import redis.asyncio as redis  # type: ignore[import]

        r = redis.from_url(redis_url, decode_responses=True)
        keys: list[str] = []
        async for k in r.scan_iter(match=f"{REDIS_KEY_AGENT_HB_PREFIX}*", count=50):
            keys.append(k)
        if keys:
            print("=== Agent heartbeats (Redis) ===\n")
            for k in keys[:10]:
                raw = await r.get(k)
                if raw:
                    try:
                        data = json.loads(raw) if isinstance(raw, str) else raw
                        pk = (data.get("public_key") or "").strip()
                        pk_preview = (
                            pk[:20] + "..." if len(pk) > 20 else pk
                        ) or "(empty)"
                        print(
                            f"  {k}: public_key={pk_preview}  "
                            f"server_id={data.get('server_id')!r}"
                        )
                    except Exception:
                        print(f"  {k}: (parse error)")
            if len(keys) > 10:
                print(f"  ... and {len(keys)-10} more keys")
        else:
            print("=== Agent heartbeats: none (NODE_DISCOVERY may be docker) ===\n")
        await r.aclose()
    except Exception as e:
        print("=== Redis: ", e, "===\n")

    print("--- Config PublicKey in your client = server public key ---")
    print("  Compare with Server.public_key above (or heartbeat public_key).")
    print("  On VPN node run: docker exec <container> awg show awg0 public-key")
    print("--- Client public key must appear as peer on node ---")
    print("  On VPN node run: docker exec <container> awg show awg0")


if __name__ == "__main__":
    asyncio.run(main())
