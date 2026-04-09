"""Server-scoped AmneziaWG H1–H4 helpers.

For NODE_MODE=real the only source of truth for H1–H4 is the runtime node
(`wg show awg0` via NodeRuntimeAdapter). In mock/agent modes we allow
profile/server-provided H values (amnezia_h1–amnezia_h4) to flow through so
test and single-node setups can control obfuscation params explicitly.
"""

from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.models import Server


async def request_params_with_server_h(
    session: AsyncSession,  # kept for signature compatibility
    server: Server,  # kept for signature/type compatibility
    request_params: dict | None,
) -> dict:
    """Return request_params, optionally stripping explicit amnezia_h* keys.

    In NODE_MODE=real we ignore profile/DB-defined H values for config
    generation to avoid desync with the runtime node's awg0 interface. In
    other modes (mock/agent) we keep any provided amnezia_h* so callers can
    specify H1–H4 directly.
    """
    params = dict(request_params) if request_params else {}
    if settings.node_mode == "real":
        for key in ("amnezia_h1", "amnezia_h2", "amnezia_h3", "amnezia_h4"):
            params.pop(key, None)
    return params
