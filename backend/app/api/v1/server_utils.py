import json
from datetime import datetime, timezone

from app.core.config import settings
from app.core.constants import REDIS_KEY_AGENT_HB_PREFIX
from app.core.redis_client import get_redis
from app.models import Server


async def get_agent_heartbeat(server_id: str) -> dict | None:
    """Return latest agent heartbeat payload from Redis, or None."""
    try:
        redis = get_redis()
        key = f"{REDIS_KEY_AGENT_HB_PREFIX}{server_id}"
        raw = await redis.get(key)
        if not raw:
            return None
        # Redis returns bytes when decode_responses=False; support both
        s = raw.decode("utf-8", errors="replace") if isinstance(raw, bytes) else raw
        return json.loads(s) if isinstance(s, str) else s
    except Exception:
        return None


async def _agent_heartbeat_server_ids() -> set[str]:
    """Return set of server_id for which Redis has agent:hb:{server_id}. Empty on error or no heartbeats."""
    try:
        redis = get_redis()
        prefix = REDIS_KEY_AGENT_HB_PREFIX
        out: set[str] = set()
        async for key in redis.scan_iter(match=f"{prefix}*", count=500):
            k = key if isinstance(key, str) else key.decode("utf-8", errors="replace")
            if k.startswith(prefix):
                sid = k[len(prefix) :].strip()
                if sid:
                    out.add(sid)
        return out
    except Exception:
        return set()


def _display_is_active(server: Server, last_seen_ts: datetime | None) -> bool:
    """In agent mode: show Active when DB is_active, or recent last_seen, or high health_score."""
    if server.is_active:
        return True
    if settings.node_discovery != "agent":
        return False
    now = datetime.now(timezone.utc)
    if last_seen_ts:
        try:
            seen = (
                last_seen_ts if last_seen_ts.tzinfo else last_seen_ts.replace(tzinfo=timezone.utc)
            )
            if (now - seen).total_seconds() <= 120:
                return True
        except Exception:
            pass
    health = getattr(server, "health_score", None)
    if health is not None and float(health) >= 0.95:
        return True
    return False
