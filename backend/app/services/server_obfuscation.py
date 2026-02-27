"""Server-scoped AmneziaWG H1–H4 helpers.

For NODE_MODE=real the only source of truth for H1–H4 is the runtime node
(`wg show awg0` via NodeRuntimeAdapter). This module no longer injects or
generates H values for config issuance; callers must always layer runtime
obfuscation over profile/server params.
"""

from sqlalchemy.ext.asyncio import AsyncSession

from app.models import Server


async def request_params_with_server_h(
    session: AsyncSession,  # kept for signature compatibility
    server: Server,  # kept for signature/type compatibility
    request_params: dict | None,
) -> dict:
    """Return request_params with any explicit amnezia_h* keys stripped.

    H1–H4 are now taken exclusively from the runtime node; profile/DB-defined H
    values are ignored for config generation to avoid desync with awg0.
    """
    params = dict(request_params) if request_params else {}
    for key in ("amnezia_h1", "amnezia_h2", "amnezia_h3", "amnezia_h4"):
        params.pop(key, None)
    return params
